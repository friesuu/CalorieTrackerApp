import { GOALS } from '../profileOptions';
import { formatKcal } from '../numbers';

// Shows the daily target AND how it was worked out, so the number isn't a black box:
// maintenance − goal deficit (+ raised to the minimum, if needed) = target
// hero: the Profile's one big number, lifted like the day's ring on Today.
function TargetCard({ profile, hero = false })
{
    const t = profile.target;
    const goal = GOALS.find((g) => g.value === profile.goal);
    const wanted = t.maintenanceKcal - t.goalDeficitKcal; // what the goal alone would give
    const people = profile.sex === 'FEMALE' ? 'women' : 'men';

    return (
        <section className={hero ? 'card target-card hero-card' : 'card target-card'} aria-labelledby="target-title">
            <h2 id="target-title" className="card-label">Your daily target</h2>
            <p className="hero-number num">
                {formatKcal(t.targetKcal)} <span className="hero-unit">kcal</span>
            </p>

            <dl className="breakdown">
                <div className="breakdown-row">
                    <dt>
                        Maintenance
                        <span className="breakdown-hint">What your body uses in a day</span>
                    </dt>
                    <dd className="num">{formatKcal(t.maintenanceKcal)}</dd>
                </div>
                <div className="breakdown-row">
                    <dt>{goal.label}</dt>
                    <dd className="num">{t.goalDeficitKcal === 0 ? '0' : `−${formatKcal(t.goalDeficitKcal)}`}</dd>
                </div>
                {t.capped && (
                    <div className="breakdown-row">
                        <dt>Raised to the safe minimum</dt>
                        <dd className="num">+{formatKcal(t.targetKcal - wanted)}</dd>
                    </div>
                )}
                <div className="breakdown-row total">
                    <dt>Daily target</dt>
                    <dd className="num">{formatKcal(t.targetKcal)}</dd>
                </div>
            </dl>

            {/* Why it was capped, in words, so it's never only a number that looks "off" */}
            {t.capped && (
                <p className="target-note">
                    {t.maintenanceKcal > t.minimumKcal
                        ? `${goal.label} would mean eating ${formatKcal(wanted)} kcal a day, below the ${formatKcal(t.minimumKcal)} kcal safe minimum for ${people}. Your target is set to ${formatKcal(t.minimumKcal)} instead, so you'll lose weight a little more slowly.`
                        : `Your estimated maintenance is already below the ${formatKcal(t.minimumKcal)} kcal safe minimum for ${people}, so your target is the minimum. For a personal weight-loss target, talk to a doctor or dietitian.`}
                </p>
            )}

            <p className="target-method">
                Maintenance is estimated with the Mifflin-St Jeor formula from your age, sex, height and weight,
                then multiplied for your activity level. 1&nbsp;kg of body fat is about 7,700&nbsp;kcal.
            </p>
        </section>
    );
}

export default TargetCard;
