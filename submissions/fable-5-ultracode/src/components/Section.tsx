interface Props {
  id?: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
}

export default function Section({ id, eyebrow, title, children, aside }: Props) {
  return (
    <section className="section" id={id} aria-label={title}>
      <div className="section-head">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {aside && <div style={{ marginLeft: 'auto' }}>{aside}</div>}
      </div>
      {children}
    </section>
  )
}
