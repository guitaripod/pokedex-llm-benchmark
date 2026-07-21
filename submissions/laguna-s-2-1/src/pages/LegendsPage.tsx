import { h } from 'preact';
import { Link } from 'preact-router/match';
import { BackButton } from '../components/pokemon/PokemonCard';

export function LegendsPage() {
  const legendaryPokemons = [
    { id: 144, name: 'articuno', types: ['ice', 'flying'], generation: 1, region: 'Kanto' },
    { id: 145, name: 'zapdos', types: ['electric', 'flying'], generation: 1, region: 'Kanto' },
    { id: 146, name: 'moltres', types: ['fire', 'flying'], generation: 1, region: 'Kanto' },
    { id: 150, name: 'mewtwo', types: ['psychic'], generation: 1, region: 'Kanto' },
    { id: 248, name: 'tyranitar', types: ['rock', 'dark'], generation: 2, region: 'Johto' },
    { id: 250, name: 'ho-oh', types: ['fire', 'flying'], generation: 2, region: 'Johto' },
    { id: 382, name: 'kyogre', types: ['water'], generation: 3, region: 'Hoenn' },
    { id: 383, name: 'groudon', types: ['ground'], generation: 3, region: 'Hoenn' },
    { id: 384, name: 'rayquaza', types: ['dragon', 'flying'], generation: 3, region: 'Hoenn' },
    { id: 483, name: 'dialga', types: ['steel', 'dragon'], generation: 4, region: 'Sinnoh' },
    { id: 484, name: 'palkia', types: ['water', 'dragon'], generation: 4, region: 'Sinnoh' },
    { id: 485, name: 'heatran', types: ['fire', 'steel'], generation: 4, region: 'Sinnoh' },
    { id: 488, name: 'cresselia', types: ['psychic'], generation: 4, region: 'Sinnoh' },
    { id: 640, name: 'terrakion', types: ['fighting', 'rock'], generation: 5, region: 'Unova' },
    { id: 641, name: 'virizion', types: ['fighting', 'grass'], generation: 5, region: 'Unova' },
    { id: 642, name: 'cobalion', types: ['fighting', 'steel'], generation: 5, region: 'Unova' },
    { id: 643, name: 'reshiram', types: ['dragon', 'fire'], generation: 5, region: 'Unova' },
    { id: 644, name: 'zekrom', types: ['dragon', 'electric'], generation: 5, region: 'Unova' },
    { id: 645, name: 'landorus', types: ['ground', 'flying'], generation: 5, region: 'Unova' },
    { id: 646, name: 'kyurem', types: ['dragon', 'ice'], generation: 5, region: 'Unova' },
    { id: 716, name: 'xerneas', types: ['fairy'], generation: 6, region: 'Kalos' },
    { id: 717, name: 'yveltal', types: ['dark', 'flying'], generation: 6, region: 'Kalos' },
    { id: 718, name: 'zygarde', types: ['dragon', 'ground'], generation: 6, region: 'Kalos' },
    { id: 773, name: 'silvally', types: ['normal'], generation: 7, region: 'Alola' },
    { id: 785, name: 'tapu-koko', types: ['electric', 'fairy'], generation: 7, region: 'Alola' },
    { id: 786, name: 'tapu-lele', types: ['psychic', 'fairy'], generation: 7, region: 'Alola' },
    { id: 787, name: 'tapu-bulu', types: ['grass', 'fairy'], generation: 7, region: 'Alola' },
    { id: 788, name: 'tapu-fini', types: ['water', 'fairy'], generation: 7, region: 'Alola' },
    { id: 791, name: 'lunala', types: ['psychic', 'ghost'], generation: 7, region: 'Alola' },
    { id: 800, name: 'necrozma', types: ['psychic'], generation: 7, region: 'Alola' },
    { id: 807, name: 'magearna', types: ['steel', 'fairy'], generation: 7, region: 'Alola' },
    { id: 808, name: 'marshadow', types: ['fighting', 'ghost'], generation: 7, region: 'Alola' },
    { id: 809, name: 'poipole', types: ['poison'], generation: 7, region: 'Alola' },
    { id: 890, name: 'zacian', types: ['fairy', 'steel'], generation: 8, region: 'Galar' },
    { id: 898, name: 'eternatus', types: ['poison', 'dragon'], generation: 8, region: 'Galar' },
    { id: 905, name: 'kubfu', types: ['fighting'], generation: 8, region: 'Galar' },
    { id: 906, name: 'regieleki', types: ['electric'], generation: 8, region: 'Galar' },
    { id: 907, name: 'regidrago', types: ['dragon'], generation: 8, region: 'Galar' },
    { id: 908, name: 'glastrier', types: ['ice'], generation: 8, region: 'Galar' },
    { id: 909, name: 'spectrier', types: ['ghost'], generation: 8, region: 'Galar' },
    { id: 910, name: 'calyrex', types: ['psychic', 'grass'], generation: 8, region: 'Galar' },
    { id: 911, name: 'walking-wake', types: ['water', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 912, name: 'iron-hands', types: ['fighting', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 913, name: 'scream-tail', types: ['fair', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 914, name: 'brute-bonnet', types: ['grass', 'dark'], generation: 9, region: 'Paldea' },
    { id: 915, name: 'flutter-mane', types: ['ghost', 'fairy'], generation: 9, region: 'Paldea' },
    { id: 916, name: 'slither-wing', types: ['bug', 'fighting'], generation: 9, region: 'Paldea' },
    { id: 917, name: 'sandy-shocks', types: ['electric', 'ground'], generation: 9, region: 'Paldea' },
    { id: 918, name: 'iron-jugulis', types: ['dark', 'flying'], generation: 9, region: 'Paldea' },
    { id: 919, name: 'iron-moth', types: ['bug', 'fire'], generation: 9, region: 'Paldea' },
    { id: 920, name: 'iron-thorns', types: ['bug', 'rock'], generation: 9, region: 'Paldea' },
    { id: 921, name: 'frigibax', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 922, name: 'arctibax', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 923, name: 'baxcalibur', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 924, name: 'gimmighoul', types: ['steel'], generation: 9, region: 'Paldea' },
    { id: 925, name: 'ghoulardge', types: ['steel', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 926, name: 'greavard', types: ['dark', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 927, name: 'houndstone', types: ['dark', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 928, name: 'flamigo', types: ['fighting', 'flying'], generation: 9, region: 'Paldea' },
    { id: 929, name: 'cetoddle', types: ['ice', 'rock'], generation: 9, region: 'Paldea' },
    { id: 930, name: 'cetitan', types: ['ice', 'rock'], generation: 9, region: 'Paldea' },
    { id: 931, name: 'veluza', types: ['water', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 932, name: 'dondozo', types: ['water'], generation: 9, region: 'Paldea' },
    { id: 933, name: 'tatsugiri', types: ['water', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 934, name: 'annihilape', types: ['fighting', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 935, name: 'clodsire', types: ['poison', 'ground'], generation: 9, region: 'Paldea' },
    { id: 936, name: 'farigiraf', types: ['normal', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 937, name: 'kingambit', types: ['dark', 'steel'], generation: 9, region: 'Paldea' },
    { id: 938, name: 'great-tusk', types: ['ground', 'fighting'], generation: 9, region: 'Paldea' },
    { id: 939, name: 'scream-tail', types: ['fairy', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 940, name: 'brute-bonnet', types: ['grass', 'dark'], generation: 9, region: 'Paldea' },
    { id: 941, name: 'flutter-mane', types: ['ghost', 'fairy'], generation: 9, region: 'Paldea' },
    { id: 942, name: 'slither-wing', types: ['bug', 'fighting'], generation: 9, region: 'Paldea' },
    { id: 943, name: 'sandy-shocks', types: ['electric', 'ground'], generation: 9, region: 'Paldea' },
    { id: 944, name: 'iron-treads', types: ['ground', 'steel'], generation: 9, region: 'Paldea' },
    { id: 945, name: 'iron-bUNDLE', types: ['ice', 'water'], generation: 9, region: 'Paldea' },
    { id: 946, name: 'iron-hands', types: ['fighting', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 947, name: 'iron-jugulis', types: ['dark', 'flying'], generation: 9, region: 'Paldea' },
    { id: 948, name: 'iron-moth', types: ['bug', 'fire'], generation: 9, region: 'Paldea' },
    { id: 949, name: 'iron-thorns', types: ['bug', 'rock'], generation: 9, region: 'Paldea' },
    { id: 950, name: 'frigibax', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 951, name: 'arctibax', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 952, name: 'baxcalibur', types: ['ice', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 953, name: 'gimmighoul', types: ['steel'], generation: 9, region: 'Paldea' },
    { id: 954, name: 'ghoulardge', types: ['steel', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 955, name: 'greavard', types: ['dark', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 956, name: 'houndstone', types: ['dark', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 957, name: 'flamigo', types: ['fighting', 'flying'], generation: 9, region: 'Paldea' },
    { id: 958, name: 'cetoddle', types: ['ice', 'rock'], generation: 9, region: 'Paldea' },
    { id: 959, name: 'cetitan', types: ['ice', 'rock'], generation: 9, region: 'Paldea' },
    { id: 960, name: 'veluza', types: ['water', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 961, name: 'dondozo', types: ['water'], generation: 9, region: 'Paldea' },
    { id: 962, name: 'tatsugiri', types: ['water', 'dragon'], generation: 9, region: 'Paldea' },
    { id: 963, name: 'annihilape', types: ['fighting', 'ghost'], generation: 9, region: 'Paldea' },
    { id: 964, name: 'clodsire', types: ['poison', 'ground'], generation: 9, region: 'Paldea' },
    { id: 965, name: 'farigiraf', types: ['normal', 'psychic'], generation: 9, region: 'Paldea' },
    { id: 966, name: 'kingambit', types: ['dark', 'steel'], generation: 9, region: 'Paldea' },
  ];

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">Legends & Mythicals</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        All legendary and mythical Pokémon across all generations.
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {legendaryPokemons.map((p) => (
          <Link key={p.id} href={`/pokemon/${p.name}/`}>
            <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-4 text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                alt={p.name}
                class="w-20 h-20 mx-auto"
              />
              <h3 class="font-bold capitalize mt-2 text-sm">{p.name.replace(/-/g, ' ')}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">#{p.id} · Gen {p.generation}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
