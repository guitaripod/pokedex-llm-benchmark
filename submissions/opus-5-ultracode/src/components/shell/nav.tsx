import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  shortcut?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dex',
    items: [
      {
        to: '/',
        label: 'Overview',
        icon: (
          <Icon>
            <path d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1Z" />
          </Icon>
        ),
      },
      {
        to: '/pokedex',
        label: 'Pokédex',
        shortcut: 'P',
        icon: (
          <Icon>
            <circle cx="10" cy="10" r="7.5" />
            <path d="M2.5 10h4M13.5 10h4" />
            <circle cx="10" cy="10" r="2.5" />
          </Icon>
        ),
      },
      {
        to: '/pokedexes',
        label: 'Regional dexes',
        icon: (
          <Icon>
            <path d="M3.5 4.5 8 3l4 1.5L16.5 3v12.5L12 17l-4-1.5-4.5 1.5Z" />
            <path d="M8 3v12.5M12 4.5V17" />
          </Icon>
        ),
      },
      {
        to: '/favorites',
        label: 'Collection',
        icon: (
          <Icon>
            <path d="M10 16.5s-6-3.8-6-8a3.4 3.4 0 0 1 6-2.1A3.4 3.4 0 0 1 16 8.5c0 4.2-6 8-6 8Z" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: 'Database',
    items: [
      {
        to: '/moves',
        label: 'Moves',
        shortcut: 'M',
        icon: (
          <Icon>
            <path d="M3 14.5 9 3l2.4 4.8L17 5l-2 12H5Z" />
          </Icon>
        ),
      },
      {
        to: '/abilities',
        label: 'Abilities',
        icon: (
          <Icon>
            <path d="M10 2.5 12.3 7l5 .7-3.6 3.5.9 5-4.6-2.4L5.4 16l.9-5L2.7 7.7 7.7 7Z" />
          </Icon>
        ),
      },
      {
        to: '/items',
        label: 'Items',
        shortcut: 'I',
        icon: (
          <Icon>
            <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5Z" />
            <path d="M3 6.5 10 10l7-3.5M10 10v7" />
          </Icon>
        ),
      },
      {
        to: '/berries',
        label: 'Berries',
        icon: (
          <Icon>
            <circle cx="7.5" cy="12.5" r="4" />
            <circle cx="13" cy="10" r="3.2" />
            <path d="M10 6.5C10 4.5 11.5 3 13.5 3" />
          </Icon>
        ),
      },
      {
        to: '/machines',
        label: 'TMs & HMs',
        icon: (
          <Icon>
            <rect x="3" y="4.5" width="14" height="11" rx="1.5" />
            <path d="M6.5 8h7M6.5 11.5h4" />
          </Icon>
        ),
      },
      {
        to: '/locations',
        label: 'Locations',
        icon: (
          <Icon>
            <path d="M10 17s5.5-4.9 5.5-9a5.5 5.5 0 1 0-11 0c0 4.1 5.5 9 5.5 9Z" />
            <circle cx="10" cy="8" r="2" />
          </Icon>
        ),
      },
      {
        to: '/types',
        label: 'Type chart',
        shortcut: 'T',
        icon: (
          <Icon>
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="11" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="11" width="6" height="6" rx="1" />
            <rect x="11" y="11" width="6" height="6" rx="1" />
          </Icon>
        ),
      },
      {
        to: '/natures',
        label: 'Natures',
        icon: (
          <Icon>
            <path d="M10 17V9M10 9c0-3 2-6 6-6 0 3.5-2.5 6-6 6ZM10 12c0-2.5-1.8-5-5-5 0 3 2 5 5 5Z" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: 'Tools',
    items: [
      {
        to: '/team',
        label: 'Team builder',
        shortcut: 'B',
        icon: (
          <Icon>
            <circle cx="7" cy="7" r="2.6" />
            <circle cx="14" cy="7.5" r="2.1" />
            <path d="M2.6 16c0-2.6 2-4.4 4.4-4.4s4.4 1.8 4.4 4.4M13 11.7c2.2 0 4 1.6 4 4.3" />
          </Icon>
        ),
      },
      {
        to: '/compare',
        label: 'Compare',
        icon: (
          <Icon>
            <path d="M10 3v14M4.5 7 2.5 12h4ZM15.5 7l-2 5h4Z" />
            <path d="M4.5 7 10 5.5 15.5 7" />
          </Icon>
        ),
      },
      {
        to: '/calc/damage',
        label: 'Damage calc',
        icon: (
          <Icon>
            <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
            <path d="M7 6h6M7 9.5h2M7 13h2M13 9.5v3.5" />
          </Icon>
        ),
      },
      {
        to: '/calc/catch',
        label: 'Catch calc',
        icon: (
          <Icon>
            <circle cx="10" cy="10" r="7.5" />
            <path d="M2.5 10h15" />
            <circle cx="10" cy="10" r="2.5" />
          </Icon>
        ),
      },
      {
        to: '/coverage',
        label: 'Type coverage',
        icon: (
          <Icon>
            <path d="M10 2.5 16.5 5v5.5c0 4-2.8 6.3-6.5 7-3.7-.7-6.5-3-6.5-7V5Z" />
            <path d="m7.3 10 1.9 1.9 3.5-3.8" />
          </Icon>
        ),
      },
      {
        to: '/leaderboard',
        label: 'Leaderboards',
        icon: (
          <Icon>
            <path d="M3.5 16.5h13M6 16.5V9M10 16.5V4M14 16.5v-5" />
          </Icon>
        ),
      },
      {
        to: '/play/whos-that',
        label: "Who's that?",
        icon: (
          <Icon>
            <circle cx="10" cy="10" r="7.5" />
            <path d="M8 7.8a2.1 2.1 0 1 1 2.8 2c-.6.3-.9.8-.9 1.4v.4" />
            <path d="M10 14.4h.01" />
          </Icon>
        ),
      },
    ],
  },
]

export const FOOTER_ITEMS: NavItem[] = [
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <Icon>
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7 13.9 6.1M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
      </Icon>
    ),
  },
  {
    to: '/about',
    label: 'About',
    icon: (
      <Icon>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 9v4.5M10 6.5h.01" />
      </Icon>
    ),
  },
]
