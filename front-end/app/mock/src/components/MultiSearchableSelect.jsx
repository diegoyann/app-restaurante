import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * SearchableSelect — combobox com filtro em tempo real.
 * Renderiza via Portal para escapar de clip/overflow.
 */
export default function MultiSearchableSelect({
  value: propValue = [],
  defaultValue = [],
  onChange,
  options: rawOptions = [],
  placeholder = 'Selecione',
  disabled = false,
  required = false,
  className = '',
  id,
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  const [localValue, setLocalValue] = useState(() => propValue ?? defaultValue);

  useEffect(() => {
    if (propValue !== undefined) {
      setLocalValue(propValue);
    }
  }, [propValue]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const form = container.closest('form');
    if (!form) return;

    const handleReset = () => {
      setLocalValue(defaultValue || []);
    };

    form.addEventListener('reset', handleReset);
    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [defaultValue]);

  const value = propValue !== undefined ? propValue : localValue;

  const { flatOptions, groupedOptions } = useMemo(() => {
    const flat = [];
    const grouped = [];

    for (const opt of rawOptions) {
      if (opt.options && Array.isArray(opt.options)) {
        const groupItems = opt.options.map((item) => ({
          value: String(item.value ?? ''),
          label: String(item.label ?? item.value ?? ''),
          group: opt.label
        }));
        flat.push(...groupItems);
        grouped.push({ label: opt.label, items: groupItems });
      } else {
        const item = {
          value: String(opt.value ?? ''),
          label: String(opt.label ?? opt.value ?? ''),
          group: opt.group || null
        };
        flat.push(item);

        const lastGroup = grouped[grouped.length - 1];
        if (item.group) {
          if (lastGroup && lastGroup.label === item.group) {
            lastGroup.items.push(item);
          } else {
            grouped.push({ label: item.group, items: [item] });
          }
        } else {
          if (lastGroup && !lastGroup.label) {
            lastGroup.items.push(item);
          } else {
            grouped.push({ label: null, items: [item] });
          }
        }
      }
    }

    return { flatOptions: flat, groupedOptions: grouped };
  }, [rawOptions]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredGrouped = useMemo(() => {
    if (!normalizedSearch) return groupedOptions;

    return groupedOptions
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedSearch) ||
            item.value.toLowerCase().includes(normalizedSearch)
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedOptions, normalizedSearch]);

  const filteredFlat = useMemo(
    () => filteredGrouped.flatMap((group) => group.items),
    [filteredGrouped]
  );

  const selectedLabels = useMemo(() => {
    if (!Array.isArray(value)) return [];
    return value.map((val) => {
      const found = flatOptions.find((opt) => opt.value === String(val));
      return found?.label || val;
    });
  }, [flatOptions, value]);

  // Position logic
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handler = (event) => {
      const clickInContainer = containerRef.current && containerRef.current.contains(event.target);
      const clickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      
      if (!clickInContainer && !clickInDropdown) {
        setIsOpen(false);
        setSearch('');
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-searchable-option]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearch('');
    setHighlightIndex(-1);
    updatePosition();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, updatePosition]);

  const selectOption = useCallback(
    (optionValue) => {
      const currentValues = Array.isArray(value) ? value : [];
      let nextValues;
      if (currentValues.includes(optionValue)) {
        nextValues = currentValues.filter((v) => v !== optionValue);
      } else {
        nextValues = [...currentValues, optionValue];
      }
      setLocalValue(nextValues);
      onChange?.(nextValues);
      setSearch('');
    },
    [value, onChange]
  );

  const clearValue = useCallback(
    (event) => {
      event.stopPropagation();
      setLocalValue([]);
      onChange?.([]);
      setSearch('');
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightIndex((prev) => Math.min(prev + 1, filteredFlat.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightIndex >= 0 && filteredFlat[highlightIndex]) {
            selectOption(filteredFlat[highlightIndex].value);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearch('');
          setHighlightIndex(-1);
          break;
        default:
          break;
      }
    },
    [isOpen, openDropdown, highlightIndex, filteredFlat, selectOption]
  );

  let flatIndex = -1;

  return (
    <div ref={containerRef} className={`searchable-select ${isOpen ? 'searchable-select--open' : ''} ${disabled ? 'searchable-select--disabled' : ''} ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      {required && !value && <input tabIndex={-1} required className="searchable-select__required-proxy" />}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        className="searchable-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`searchable-select__value ${selectedLabels.length === 0 ? 'searchable-select__value--placeholder' : ''}`}>
          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((lbl, idx) => (
                <span key={idx} className="bg-gray-100 text-[#2A1E15] px-2 py-0.5 rounded-md text-xs font-bold uppercase flex items-center gap-1">
                  {lbl}
                </span>
              ))}
            </div>
          ) : placeholder}
        </span>
        <span className="searchable-select__icons">
          {Array.isArray(value) && value.length > 0 && !disabled && (
            <span className="searchable-select__clear" onClick={clearValue} role="button" tabIndex={-1} aria-label="Limpar seleção">
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`searchable-select__chevron ${isOpen ? 'searchable-select__chevron--open' : ''}`} />
        </span>
      </button>

      {isOpen && dropdownCoords && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="searchable-select__dropdown" 
          style={{ 
            position: 'absolute', 
            top: dropdownCoords.top, 
            left: dropdownCoords.left, 
            width: dropdownCoords.width,
            zIndex: 99999
          }}
        >
          <div className="searchable-select__search-wrap">
            <Search size={14} className="searchable-select__search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="searchable-select__search-input"
              placeholder="Filtrar..."
              autoComplete="off"
            />
          </div>

          <ul ref={listRef} className="searchable-select__list" role="listbox">
            {filteredGrouped.map((group, groupIndex) => (
              <li key={group.label || `group-${groupIndex}`} role="group">
                {group.label && (
                  <div className="searchable-select__group-label" role="presentation">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  flatIndex++;
                  const currentIndex = flatIndex;
                  const isSelected = Array.isArray(value) ? value.includes(item.value) : false;
                  const isHighlighted = currentIndex === highlightIndex;

                  return (
                    <div
                      key={`${item.value}-${currentIndex}`}
                      data-searchable-option
                      role="option"
                      aria-selected={isSelected}
                      className={`searchable-select__option ${isSelected ? 'searchable-select__option--selected' : ''} ${isHighlighted ? 'searchable-select__option--highlighted' : ''}`}
                      onClick={() => selectOption(item.value)}
                      onMouseEnter={() => setHighlightIndex(currentIndex)}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </li>
            ))}

            {filteredFlat.length === 0 && (
              <li className="searchable-select__empty">
                Nenhum resultado encontrado.
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
