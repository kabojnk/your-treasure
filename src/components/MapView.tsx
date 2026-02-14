import { useEffect, useRef } from 'react';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Bookmark } from '../lib/types';
import { MAP_DEFAULTS } from '../lib/constants';
import '../styles/map.css';

interface MapViewProps {
  bookmarks: Bookmark[];
  selectedBookmarkId: string | null;
  onMarkerClick: (id: string) => void;
}

export function MapView({ bookmarks, selectedBookmarkId, onMarkerClick }: MapViewProps) {
  const map = useMap();
  const prevZoomRef = useRef<number>(MAP_DEFAULTS.zoom);
  const prevCenterRef = useRef<google.maps.LatLngLiteral>(MAP_DEFAULTS.center);

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

  return (
    <Map
      mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
      defaultCenter={MAP_DEFAULTS.center}
      defaultZoom={MAP_DEFAULTS.zoom}
      mapTypeId={MAP_DEFAULTS.mapTypeId}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="map-container"
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
    </Map>
  );
}
