import { useState, useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Track if the API has been loaded globally
let isGloballyLoaded = false;
let loadPromise: Promise<void> | null = null;

async function loadGoogleMapsApi(): Promise<void> {
    // Do nothing if already available
    if (typeof google !== 'undefined' && google.maps) {
        return;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry,marker&v=weekly&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // Wait for google.maps to be available
            const checkGoogle = () => {
                if (typeof google !== 'undefined' && google.maps) {
                    resolve();
                } else {
                    setTimeout(checkGoogle, 50);
                }
            };
            checkGoogle();
        };
        script.onerror = (err) => {
            reject(new Error('Failed to load Google Maps script'));
        };

        // Avoid duplicate script tags
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (!existingScript) {
            document.head.appendChild(script);
        } else {
            // Script already added, just wait for it
            const checkGoogle = () => {
                if (typeof google !== 'undefined' && google.maps) {
                    resolve();
                } else {
                    setTimeout(checkGoogle, 50);
                }
            };
            checkGoogle();
        }
    });
}

export const useGoogleMapsApi = () => {
    const [isLoaded, setIsLoaded] = useState(isGloballyLoaded);
    const [loadError, setLoadError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        if (!API_KEY) {
            setLoadError(new Error("Google Maps API Key is missing (VITE_GOOGLE_MAPS_API_KEY)"));
            return;
        }

        if (isGloballyLoaded) {
            setIsLoaded(true);
            return;
        }

        if (!loadPromise) {
            loadPromise = loadGoogleMapsApi();
        }

        loadPromise
            .then(() => {
                isGloballyLoaded = true;
                setIsLoaded(true);
            })
            .catch((err) => {
                setLoadError(err);
                console.error("Failed to load Google Maps API", err);
            });

    }, []);

    return { isLoaded, loadError };
};
