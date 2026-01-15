import React from 'react';
import { DailyMagazineSpread } from '../../../types/magazine';
import HeroSection from './HeroSection';
import NarrativeBlock from './NarrativeBlock';
import MagazineActivityCard from './MagazineActivityCard';
import InsiderTipBox from './InsiderTipBox';
import MoodBadge from './MoodBadge';

interface DaySpreadProps {
    spread: DailyMagazineSpread;
}

/**
 * DaySpread - A single day's magazine spread layout.
 * Renders the editorial content in a visually rich format.
 */
const DaySpread: React.FC<DaySpreadProps> = ({ spread }) => {
    const timeOfDayLabels: Record<string, string> = {
        morning: '☀️ Manhã',
        afternoon: '🌤️ Tarde',
        evening: '🌅 Entardecer',
        night: '🌙 Noite',
    };

    return (
        <article className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Hero Image */}
            <HeroSection
                image={spread.heroImage}
                headline={spread.headline}
                subheadline={spread.subheadline}
                dayNumber={spread.dayNumber}
                date={spread.date}
                city={spread.city}
            />

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <MoodBadge mood={spread.mood} />

                <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-base">thermostat</span>
                    {spread.weatherSummary}
                </span>

                <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-base">directions_walk</span>
                    {spread.walkingDistance}
                </span>

                <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-base">payments</span>
                    {spread.estimatedCost}
                </span>
            </div>

            {/* Intro Narrative */}
            <NarrativeBlock content={spread.introNarrative} variant="intro" />

            {/* Sections by Time of Day */}
            {spread.sections.map((section) => (
                <section key={section.timeOfDay} className="space-y-4">
                    {/* Section Header */}
                    <div className="border-l-4 border-primary pl-4">
                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{section.narrative}</p>
                    </div>

                    {/* Activities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.activities.map((activity) => (
                            <MagazineActivityCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                </section>
            ))}

            {/* Insider Tips */}
            {spread.insiderTips.length > 0 && (
                <InsiderTipBox tips={spread.insiderTips} />
            )}

            {/* Local Phrases */}
            {spread.localPhrases && spread.localPhrases.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                    <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">🗣️</span>
                        Frases Úteis
                    </h4>
                    <div className="space-y-3">
                        {spread.localPhrases.map((phrase, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <span className="text-lg">💬</span>
                                <div>
                                    <p className="font-medium text-amber-900">{phrase.phrase}</p>
                                    <p className="text-sm text-amber-700">{phrase.translation}</p>
                                    {phrase.pronunciation && (
                                        <p className="text-xs text-amber-600 italic mt-0.5">
                                            Pronúncia: {phrase.pronunciation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Closing Thought */}
            <NarrativeBlock content={spread.closingThought} variant="closing" />
        </article>
    );
};

export default DaySpread;
