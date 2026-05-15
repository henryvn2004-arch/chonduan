import { Suspense } from 'react'
import MapPage from './MapPage'

export default function Home() {
  return (
    <Suspense>
      <MapPage />
    </Suspense>
  )
}
