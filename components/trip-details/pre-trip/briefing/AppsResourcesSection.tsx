import React from 'react';
import { RecommendedApp } from '../../../../types/preTripBriefing';

interface AppsResourcesSectionProps {
    apps: RecommendedApp[];
}

export const AppsResourcesSection: React.FC<AppsResourcesSectionProps> = ({ apps }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span> Apps Essenciais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {apps.map((app, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {app.icon ? (
                                    <span className="material-symbols-outlined text-xl">{app.icon}</span>
                                ) : (
                                    <span className="material-symbols-outlined text-xl">smartphone</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight text-sm">{app.name}</h3>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{app.category}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">
                            {app.description}
                        </p>

                        <div className="flex gap-2">
                            {app.iosUrl && (
                                <a href={app.iosUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-colors">
                                    App Store
                                </a>
                            )}
                            {app.androidUrl && (
                                <a href={app.androidUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-colors">
                                    Play Store
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
