import { useRef, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { PNW_BOUNDS } from '../lib/constants';
import '../styles/search.css';

// Monkey-patch attachShadow to force open mode on gmp-place-autocomplete
// so we can inject light-mode styles into its closed shadow DOM.
const originalAttachShadow = Element.prototype.attachShadow;
if (!(window as any).__gmpShadowPatched) {
  (window as any).__gmpShadowPatched = true;
  Element.prototype.attachShadow = function (init: ShadowRootInit) {
    if (this.localName === 'gmp-place-autocomplete') {
      const shadow = originalAttachShadow.call(this, { ...init, mode: 'open' as const });
      const style = document.createElement('style');
      style.textContent = `
        .input-container {
          background-color: #fffef9 !important;
          border: 1px solid #e8b87a !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
          color: #333333 !important;
        }
        .input-container:focus-within {
          border-color: #a690a4 !important;
          box-shadow: 0 0 0 2px rgba(166,144,164,0.25) !important;
        }
        input {
          background: transparent !important;
          border: none !important;
          color: #333333 !important;
          font-family: 'Libre Baskerville', Georgia, serif !important;
          font-size: 14px !important;
        }
        input::placeholder {
          color: #b1b695 !important;
        }
      `;
      shadow.appendChild(style);
      return shadow;
    }
    return originalAttachShadow.call(this, init);
  };
}

export interface PlaceData {
  name: string;
  address: string;
  summary: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
}

interface SearchBarProps {
  onPlaceSelected: (placeData: PlaceData) => void;
}

export function SearchBar({ onPlaceSelected }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const places = useMapsLibrary('places');
  const callbackRef = useRef(onPlaceSelected);
  callbackRef.current = onPlaceSelected;

  const handleSelect = useCallback(async (event: Event) => {
    // The gmp-select event provides a placePrediction property (not event.detail.place).
    // We must call .toPlace() to get a usable Place instance.
    const { placePrediction } = event as any;
    if (!placePrediction) return;

    const place = placePrediction.toPlace();

    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'editorialSummary', 'location', 'photos'],
      });

      const location = place.location;
      let photoUrl: string | null = null;

      if (place.photos && place.photos.length > 0) {
        try {
          photoUrl = place.photos[0].getURI({ maxHeight: 400 });
        } catch {
          // Photo URL extraction failed
        }
      }

      callbackRef.current({
        name: place.displayName ?? '',
        address: place.formattedAddress ?? '',
        summary: (place as any).editorialSummary ?? null,
        lat: location?.lat() ?? 0,
        lng: location?.lng() ?? 0,
        photoUrl,
      });
    } catch (err) {
      console.error('Error fetching place fields:', err);
    }
  }, []);

  useEffect(() => {
    if (!places || !containerRef.current) return;

    const container = containerRef.current;

    // Clear any previous elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      const autocompleteElement = new (google.maps.places as any).PlaceAutocompleteElement({
        locationBias: new google.maps.LatLngBounds(
          { lat: PNW_BOUNDS.south, lng: PNW_BOUNDS.west },
          { lat: PNW_BOUNDS.north, lng: PNW_BOUNDS.east }
        ),
      });

      container.appendChild(autocompleteElement);
      autocompleteElement.addEventListener('gmp-select', handleSelect);

      return () => {
        autocompleteElement.removeEventListener('gmp-select', handleSelect);
        if (container.contains(autocompleteElement)) {
          container.removeChild(autocompleteElement);
        }
      };
    } catch (err) {
      console.error('Error creating PlaceAutocompleteElement:', err);
    }
  }, [places, handleSelect]);

  return (
    <div className="search-bar-wrapper">
      <div ref={containerRef} className="search-bar-container" />
    </div>
  );
}
