import { Suspense } from 'react'
import MapPage from './MapPage'

export default function Home() {
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? ''
  return (
    <Suspense>
      <MapPage mapsApiKey={mapsApiKey} />
    </Suspense>
  )
}
