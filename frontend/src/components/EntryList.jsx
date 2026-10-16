import LogEntryRow from './LogEntryRow';
import { ChevronRightIcon } from './Icons';

// Logged entries as rows you can tap: change how much, move it to another meal, or remove it
function EntryList({ entries, onEdit })
{
    return (
        <ul className="card list-card">
            {entries.map((entry) => (
                <li key={entry.id}>
                    <button className="row-button" onClick={() => onEdit(entry)} aria-label={`Edit ${entry.name}`}>
                        <LogEntryRow entry={entry} />
                        <span className="row-chevron"><ChevronRightIcon size={18} /></span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

export default EntryList;
