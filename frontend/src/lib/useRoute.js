import { useCallback, useEffect, useState } from 'react'

// ponytail: hand-rolled pushState routing. Four static paths and one slug do not
// justify a router dependency. Add one when nested or parameterised routes appear.
export function useRoute() {
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}
