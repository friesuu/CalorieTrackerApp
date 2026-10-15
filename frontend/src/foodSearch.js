// The foods whose name contains the search text, ignoring capitals. Empty search = all of them.
// Used by the Foods page and the daily log's food picker, so both search the same way.
export function filterFoods(foods, search)
{
    const query = search.trim().toLowerCase();
    return query ? foods.filter((f) => f.name.toLowerCase().includes(query)) : foods;
}
