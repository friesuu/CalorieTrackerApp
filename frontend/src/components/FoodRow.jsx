import { formatAmount, formatKcal, formatServing } from '../numbers';

// "6 g protein · 38 g carbs", only the ones that are known
function macrosText(food)
{
    return [
        food.proteinG !== null && `${formatAmount(food.proteinG)} g protein`,
        food.carbsG !== null && `${formatAmount(food.carbsG)} g carbs`,
        food.fatG !== null && `${formatAmount(food.fatG)} g fat`,
    ].filter(Boolean).join(' · ');
}

// One food in a list: name on the left, serving muted in the middle, calories on the right.
// stacked (the Today library): two lines, the serving under the name and the calories as a pill,
// so a narrow list reads as one column of names and one of numbers.
function FoodRow({ food, stacked = false })
{
    if (stacked)
    {
        return(
            <div className="food-row stacked">
                <span className="food-name">
                    {food.name}
                    <span className="food-sub">{formatServing(food.servingSize, food.servingUnit)}</span>
                </span>
                <span className="pill pill-info num">{formatKcal(food.kcalPerServing)} kcal</span>
            </div>
        );
    }

    const macros = macrosText(food);

    return(
        <div className="food-row">
            <span className="food-name">
                {food.name}
                {macros && <span className="food-macros">{macros}</span>}
            </span>
            <span className="food-serving">{formatServing(food.servingSize, food.servingUnit)}</span>
            <span className="food-kcal num">{formatKcal(food.kcalPerServing)} kcal</span>
        </div>
    );
}

export default FoodRow;
