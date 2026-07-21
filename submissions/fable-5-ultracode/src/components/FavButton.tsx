import { useFavorites } from '../lib/store'

interface Props {
  id: number
  name: string
}

export default function FavButton({ id, name }: Props) {
  const { isFav, toggle } = useFavorites()
  const on = isFav(id)
  return (
    <button
      type="button"
      className={`fav-btn${on ? ' on' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        toggle(id)
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" />
      </svg>
    </button>
  )
}
