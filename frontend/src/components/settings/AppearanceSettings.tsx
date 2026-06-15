import type { CSSProperties } from 'react';
import { useTheme, type ThemeMode } from '@/theme/ThemeContext';
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '@/theme/accents';
import { Icon, type IconName } from '@/lib/icons';
import './AppearanceSettings.css';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' },
];

export function AppearanceSettings() {
  const { mode, accent, setMode, setAccent, reset } = useTheme();
  const isDefault = mode === 'system' && accent.toLowerCase() === DEFAULT_ACCENT.toLowerCase();

  return (
    <section className="appearance">
      <div className="appearance__head">
        <div>
          <h2 className="appearance__title">Appearance</h2>
          <p className="appearance__desc">Customize how Raft looks on this device.</p>
        </div>
        <button
          type="button"
          className="appearance__reset"
          onClick={reset}
          disabled={isDefault}
        >
          Reset to defaults
        </button>
      </div>

      <div className="appearance__field">
        <div className="appearance__field-info">
          <h3 className="appearance__field-label">Theme</h3>
          <p className="appearance__field-hint">Choose light, dark, or match your system.</p>
        </div>
        <div className="appearance__segmented" role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`appearance__segment${mode === option.value ? ' appearance__segment--active' : ''}`}
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
            >
              <Icon name={option.icon} size={16} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="appearance__field">
        <div className="appearance__field-info">
          <h3 className="appearance__field-label">Accent color</h3>
          <p className="appearance__field-hint">Used for buttons, links, and highlights.</p>
        </div>
        <div className="appearance__swatches" role="group" aria-label="Accent color">
          {ACCENT_PRESETS.map((preset) => {
            const selected = accent.toLowerCase() === preset.value.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                className={`appearance__swatch${selected ? ' appearance__swatch--active' : ''}`}
                style={{ '--swatch': preset.value } as CSSProperties}
                aria-label={preset.name}
                aria-pressed={selected}
                onClick={() => setAccent(preset.value)}
              >
                {selected && <Icon name="check" size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
