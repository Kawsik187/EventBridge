import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import { registrationService } from '../../services/registrationService';
import EventCard from '../../components/events/EventCard';
import CategoryPill from '../../components/common/CategoryPill';
import { Search, Building2 } from 'lucide-react';

const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 'Seminar', 'Competition', 'Club Events', 'Academic', 'Arts', 'Innovation'];

const EventsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const deptParam = searchParams.get('department') || '';

  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [search, setSearch] = useState(searchParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      registrationService.getMyRegistrations()
        .then((regs) => {
          const ids = new Set(
            (regs || [])
              .filter((r) => r.status !== 'cancelled')
              .map((r) => r.eventId?._id || r.eventId)
          );
          setRegisteredIds(ids);
        })
        .catch(() => {});
    } else {
      setRegisteredIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setSearch(searchParam);
    loadEvents(categoryParam, searchParam, deptParam);
  }, [categoryParam, searchParam, deptParam]);

  const loadEvents = async (cat = categoryParam, query = searchParam, dept = deptParam) => {
    setLoading(true);
    try {
      const params = { category: cat, search: query };
      if (dept) params.departmentId = dept;
      const data = await eventService.getAllEvents(params);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (cat) => {
    const newParams = {};
    if (cat !== 'All') newParams.category = cat;
    if (searchParam) newParams.search = searchParam;
    if (deptParam) newParams.department = deptParam;
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = {};
    if (categoryParam && categoryParam !== 'All') newParams.category = categoryParam;
    if (search.trim()) newParams.search = search.trim();
    if (deptParam) newParams.department = deptParam;
    setSearchParams(newParams);
  };

  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    const newParams = {};
    if (categoryParam && categoryParam !== 'All') newParams.category = categoryParam;
    if (searchParam) newParams.search = searchParam;
    if (selectedDept) newParams.department = selectedDept;
    setSearchParams(newParams);
  };

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ marginBottom: '24px' }}>
          <h1>Campus Event Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse all upcoming and active events taking place across campus.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '700px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by event name, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>

            <select
              className="form-input"
              value={deptParam}
              onChange={handleDepartmentChange}
              style={{ width: 'auto', minWidth: '240px', cursor: 'pointer' }}
            >
              <option value="">All Departments (15 Branches)</option>
              {Array.isArray(departments) && departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.code} – {dept.name}
                </option>
              ))}

            </select>
          </div>

          <div className="category-pills-row">
            {categories.map((c) => (
              <CategoryPill key={c} category={c} active={categoryParam === c} onClick={handleCategoryClick} />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try adjusting your category or search query.</p>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((evt) => (
              <EventCard key={evt._id} event={evt} isRegistered={registeredIds.has(evt._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
