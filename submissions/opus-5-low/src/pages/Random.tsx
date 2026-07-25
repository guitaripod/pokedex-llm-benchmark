import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loading } from '../components/ui'
import { getIndex } from '../lib/data'
import { useAsync } from '../lib/hooks'

export default function RandomPage() {
  const { data: index } = useAsync(getIndex, [])
  const nav = useNavigate()
  useEffect(() => {
    if (!index) return
    const pool = index.filter((e) => e.isDefault)
    nav(`/pokemon/${pool[Math.floor(Math.random() * pool.length)].name}`, { replace: true })
  }, [index, nav])
  return <Loading label="Rolling" />
}
