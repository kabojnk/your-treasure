import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import type { Bookmark } from '../lib/types';
import type { PlaceData } from './SearchBar';
import { MAP_DEFAULTS } from '../lib/constants';
import '../styles/map.css';

interface MapViewProps {
  bookmarks: Bookmark[];
  selectedBookmarkId: string | null;
  onMarkerClick: (id: string) => void;
  onPlaceSelected: (placeData: PlaceData) => void;
}

type PoiInfo = {
  position: google.maps.LatLngLiteral;
  placeId: string;
  name: string | null;
  address: string | null;
  summary: string | null;
  photoUrl: string | null;
  loading: boolean;
};

export function MapView({ bookmarks, selectedBookmarkId, onMarkerClick, onPlaceSelected }: MapViewProps) {
  const map = useMap();
  const places = useMapsLibrary('places');
  const prevZoomRef = useRef<number>(MAP_DEFAULTS.zoom);
  const prevCenterRef = useRef<google.maps.LatLngLiteral>(MAP_DEFAULTS.center);
  const currentPoiRef = useRef<string | null>(null);

  const [poiInfo, setPoiInfo] = useState<PoiInfo | null>(null);

  // Save current map state before zooming to a pin
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('idle', () => {
      if (!selectedBookmarkId) {
        const center = map.getCenter();
        if (center) {
          prevCenterRef.current = { lat: center.lat(), lng: center.lng() };
        }
        prevZoomRef.current = map.getZoom() ?? MAP_DEFAULTS.zoom;
      }
    });

    return () => google.maps.event.removeListener(listener);
  }, [map, selectedBookmarkId]);

  // Zoom to selected bookmark
  useEffect(() => {
    if (!map) return;

    if (selectedBookmarkId) {
      const bookmark = bookmarks.find((b) => b.id === selectedBookmarkId);
      if (bookmark?.latitude && bookmark?.longitude) {
        map.panTo({ lat: bookmark.latitude, lng: bookmark.longitude });
        map.setZoom(14);
      }
    } else {
      // Restore previous view
      map.panTo(prevCenterRef.current);
      map.setZoom(prevZoomRef.current);
    }
  }, [selectedBookmarkId, map, bookmarks]);

  // Dismiss POI InfoWindow when a bookmark is selected
  useEffect(() => {
    if (selectedBookmarkId) {
      setPoiInfo(null);
      currentPoiRef.current = null;
    }
  }, [selectedBookmarkId]);

  // Handle map click — detect POI clicks via placeId
  const handleMapClick = useCallback(
    async (event: MapMouseEvent) => {
      const placeId = event.detail.placeId;

      if (!placeId) {
        // Regular map click — dismiss any open POI InfoWindow
        setPoiInfo(null);
        currentPoiRef.current = null;
        return;
      }

      // Suppress the default Google Maps POI info window
      event.stop();

      const latLng = event.detail.latLng;
      if (!latLng) return;

      // Track which POI we're fetching (race condition guard)
      currentPoiRef.current = placeId;

      // Show InfoWindow immediately with loading state
      setPoiInfo({
        position: latLng,
        placeId,
        name: null,
        address: null,
        summary: null,
        photoUrl: null,
        loading: true,
      });

      if (!places) return;

      try {
        const place = new places.Place({ id: placeId });
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'editorialSummary', 'location', 'photos'],
        });

        // Discard if user clicked a different POI while this was loading
        if (currentPoiRef.current !== placeId) return;

        let photoUrl: string | null = null;
        if (place.photos && place.photos.length > 0) {
          try {
            photoUrl = place.photos[0].getURI({ maxHeight: 400 });
          } catch {
            // Photo extraction failed
          }
        }

        const location = place.location;

        setPoiInfo({
          position: location
            ? { lat: location.lat(), lng: location.lng() }
            : latLng,
          placeId,
          name: place.displayName ?? 'Unknown place',
          address: place.formattedAddress ?? '',
          summary: (place as any).editorialSummary ?? null,
          photoUrl,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching POI details:', err);
        if (currentPoiRef.current === placeId) {
          setPoiInfo(null);
          currentPoiRef.current = null;
        }
      }
    },
    [places]
  );

  // "Add to Field Guide" button click
  const handleAddFromPoi = useCallback(() => {
    if (!poiInfo || poiInfo.loading) return;

    onPlaceSelected({
      name: poiInfo.name ?? '',
      address: poiInfo.address ?? '',
      summary: poiInfo.summary,
      lat: poiInfo.position.lat,
      lng: poiInfo.position.lng,
      photoUrl: poiInfo.photoUrl,
    });

    setPoiInfo(null);
    currentPoiRef.current = null;
  }, [poiInfo, onPlaceSelected]);

  return (
    <Map
      mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
      defaultCenter={MAP_DEFAULTS.center}
      defaultZoom={MAP_DEFAULTS.zoom}
      mapTypeId={MAP_DEFAULTS.mapTypeId}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="map-container"
      onClick={handleMapClick}
    >
      {bookmarks.map((bookmark) =>
        bookmark.latitude && bookmark.longitude ? (
          <AdvancedMarker
            key={bookmark.id}
            position={{ lat: bookmark.latitude, lng: bookmark.longitude }}
            onClick={() => onMarkerClick(bookmark.id)}
          >
            <Pin
              background={bookmark.color || '#000000'}
              borderColor="#333333"
              glyphColor={bookmark.color || '#000000'}
            />
          </AdvancedMarker>
        ) : null
      )}

      {poiInfo && (
        <InfoWindow
          position={poiInfo.position}
          onCloseClick={() => {
            setPoiInfo(null);
            currentPoiRef.current = null;
          }}
        >
          <div className="poi-info-content">
            {poiInfo.loading ? (
              <p className="poi-info-loading">Loading place details...</p>
            ) : (
              <>
                <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.85rem' }}>
                  {poiInfo.name}
                </p>
                {poiInfo.address && (
                  <p className="poi-info-address">{poiInfo.address}</p>
                )}
                <button
                  className="poi-info-add-btn"
                  onClick={handleAddFromPoi}
                >
                  + Add to Field Guide
                </button>
              </>
            )}
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
