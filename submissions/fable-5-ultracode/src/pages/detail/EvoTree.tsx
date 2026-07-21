import { Link } from 'react-router-dom'
import type { EvoNode } from '../../lib/types'
import { spriteUrl } from '../../lib/api'
import { dexNo } from '../../lib/format'
import Sprite from '../../components/Sprite'

interface NodeProps {
  node: EvoNode
  currentId: number
}

function NodeBox({ node, currentId }: NodeProps) {
  const current = node.sid === currentId
  return (
    <Link
      to={`/pokemon/${node.sid}`}
      className={`pd-evo-node${current ? ' cur' : ''}`}
      aria-current={current ? 'page' : undefined}
    >
      <Sprite src={spriteUrl(node.sid)} alt={node.dname} size={72} />
      <span className="pd-evo-no mono">{dexNo(node.sid)}</span>
      <span className="pd-evo-name">{node.dname}</span>
    </Link>
  )
}

function Branch({ node, currentId }: NodeProps) {
  return (
    <div className="pd-evo-chain">
      <NodeBox node={node} currentId={currentId} />
      {node.to.length > 0 && (
        <div className="pd-evo-branches">
          {node.to.map(child => (
            <div className="pd-evo-branch" key={child.sid}>
              <div className="pd-evo-link">
                <span className="pd-evo-arrow" aria-hidden="true">
                  ⟶
                </span>
                {child.conds.map(c => (
                  <span className="pd-evo-cond mono" key={c}>
                    {c}
                  </span>
                ))}
              </div>
              <Branch node={child} currentId={currentId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EvoTree({ root, currentId }: { root: EvoNode; currentId: number }) {
  return (
    <div className="pd-evo card">
      <Branch node={root} currentId={currentId} />
    </div>
  )
}
