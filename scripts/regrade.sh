#!/usr/bin/env bash
# Drives one submission through the full v2 grading flow with the pinned prompts.
# Usage: scripts/regrade.sh <submission-id> [stage]
#   all       (default) every stage below, end to end
#   12        grade + adversarial verify        -> /tmp/rg-<id>-p2.json
#   audit     ten independent auditors          -> /tmp/audit-<id>.json
#   3         judge adjudicates the disputes    -> /tmp/rg-<id>-final.json
# Merge the result with:
#   node scripts/grade.mjs --submission <id> --merge /tmp/rg-<id>-final.json --by "<judge>"
set -euo pipefail
cd "$(dirname "$0")/.."
ID=$1
STAGE=${2:-all}
MODEL=claude-opus-5
EFFORT=high

extract() {
  python3 -c "
import json,re,sys
d=json.load(open(sys.argv[1]))
if d.get('subtype')!='success': sys.exit('$ID: judge run failed: '+str(d.get('subtype')))
t=d['result']
m=re.findall(r'\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`', t)
e=json.loads((m[-1] if m else t).strip())
seen=set(); e['features']=[f for f in e['features'] if not (f['id'] in seen or seen.add(f['id']))]
json.dump(e, open(sys.argv[2],'w'), indent=1)
print('$ID', sys.argv[3], 'depth', sum(f['grade'] for f in e['features']), '/90', e['scores'], 'cost \$%.2f'%(d.get('total_cost_usd') or 0))
" "$1" "$2" "$3"
}

judge() {
  timeout 7200 claude -p "$(cat "$1")" --model $MODEL --effort $EFFORT \
    --dangerously-skip-permissions --disallowed-tools Edit Write NotebookEdit \
    --output-format json > "$2" 2>"/tmp/rg-$ID.err"
}

if [ "$STAGE" = "12" ] || [ "$STAGE" = "all" ]; then
  node scripts/grade.mjs --submission "$ID" >/dev/null
  judge "grading/prompts/$ID.md" "/tmp/rg-$ID-p1.raw.json"
  extract "/tmp/rg-$ID-p1.raw.json" "/tmp/rg-$ID-p1.json" pass1

  node scripts/grade.mjs --submission "$ID" --verify "/tmp/rg-$ID-p1.json" >/dev/null
  judge "grading/prompts/$ID-verify.md" "/tmp/rg-$ID-p2.raw.json"
  extract "/tmp/rg-$ID-p2.raw.json" "/tmp/rg-$ID-p2.json" pass2
fi

if [ "$STAGE" = "audit" ] || [ "$STAGE" = "all" ]; then
  node scripts/audit.mjs --submission "$ID" --entry "/tmp/rg-$ID-p2.json" --model $MODEL --out "/tmp/audit-$ID.json"
fi

if [ "$STAGE" = "3" ] || [ "$STAGE" = "all" ]; then
  node scripts/grade.mjs --submission "$ID" --adjudicate "/tmp/audit-$ID.json" --entry "/tmp/rg-$ID-p2.json" >/dev/null
  judge "grading/prompts/$ID-adjudicate.md" "/tmp/rg-$ID-p3.raw.json"
  extract "/tmp/rg-$ID-p3.raw.json" "/tmp/rg-$ID-final.json" final
fi
