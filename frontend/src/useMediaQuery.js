import { useEffect, useState } from 'react';

// true while the screen matches a CSS media query, e.g. useMediaQuery('(min-width: 1024px)').
// For layout that CSS alone can't do: the laptop shows the food library beside the log,
// the phone opens it in a sheet instead (two copies would mean two search boxes with the same id).
export function useMediaQuery(query)
{
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const list = window.matchMedia(query);
        const handleChange = () => setMatches(list.matches);
        list.addEventListener('change', handleChange);
        return () => list.removeEventListener('change', handleChange); // stop listening when the page goes
    }, [query]);

    return matches;
}
