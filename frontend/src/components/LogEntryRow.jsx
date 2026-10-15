import { formatKcal, formatPortion } from '../numbers';

// One logged item: name on the left, how much in the middle (muted), its calories on the right
function LogEntryRow({ entry })
{
    return (
        <div className="food-row">
            <span className="food-name">{entry.name}</span>
            <span className="food-serving">{formatPortion(entry.quantity, entry.servingSize, entry.servingUnit)}</span>
            <span className="food-kcal num">{formatKcal(entry.kcal)} kcal</span>
        </div>
    );
}

export default LogEntryRow;
