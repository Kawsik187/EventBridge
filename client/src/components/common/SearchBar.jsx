import React from 'react';
import { Search, MapPin } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery, selectedLocation, setSelectedLocation, onSubmit }) => {
  return (
    <form className="search-location-bar" onSubmit={onSubmit}>
      <div className="search-input-wrap">
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search events, clubs, workshops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="location-selector">
        <MapPin size={16} style={{ color: 'var(--primary)' }} />
        <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
          <option value="Central Campus">Central Campus</option>
          <option value="North Campus">North Campus Arena</option>
          <option value="East Academic Block">East Academic Block</option>
          <option value="Library Complex">Library Complex</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary btn-sm">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
