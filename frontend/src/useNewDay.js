import { useEffect } from 'react';
import { todayString } from './dates';

// Calls onNewDay when "today" may have changed while the app was open:
//  - coming back to the app (phone unlocked, tab reopened), and
//  - the clock passing midnight while it stays on screen (e.g. a laptop left open), checked once a minute.
// The server still decides which day "today" is (in your time zone); this only says "ask again".
// Used by Today and History, only while they show the current day or week (enabled).
export function useNewDay(onNewDay, enabled = true)
{
    useEffect(() => {
        if (!enabled) return;

        let lastDate = todayString();
        const handleVisible = () => {
            if (document.visibilityState === 'visible') onNewDay();
        };
        const timer = setInterval(() => {
            const now = todayString();
            if (now !== lastDate)
            {
                lastDate = now;
                onNewDay();
            }
        }, 60 * 1000);

        document.addEventListener('visibilitychange', handleVisible);
        return () => {
            clearInterval(timer); // stop checking when the page goes, or stops showing the current day
            document.removeEventListener('visibilitychange', handleVisible);
        };
    }, [onNewDay, enabled]);
}
