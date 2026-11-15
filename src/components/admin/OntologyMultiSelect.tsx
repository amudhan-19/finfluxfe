// @author  veera
// @file    components/admin/OntologyMultiSelect.tsx
//
// Reusable multi-select dropdown for Ontology Mapping GL / Dimension fields.
// Wraps MUI Autocomplete (multiple) with checkbox list, chip tags, and a
// "N selected / Clear all" header row. Generic over the option type.

import { Autocomplete, Checkbox, Chip, TextField } from '@mui/material'

interface Props<TOption extends object> {
  options: TOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  getOptionValue: (opt: TOption) => string
  getOptionLabel: (opt: TOption) => string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  emptyText?: string
  ariaLabel?: string
  groupBy?: (opt: TOption) => string
}

export function OntologyMultiSelect<TOption extends object>({
  options,
  selectedValues,
  onChange,
  getOptionValue,
  getOptionLabel,
  placeholder = 'Search and select…',
  disabled = false,
  loading = false,
  emptyText = 'No options available',
  ariaLabel,
  groupBy,
}: Props<TOption>) {
  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(getOptionValue(opt)),
  )

  return (
    <div className="ont-glselect">
      {/* Count + clear-all header */}
      <div className="ont-glselect__head">
        {selectedValues.length > 0 && (
          <>
            <span className="ont-glselect__count">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              className="ont-glselect__clear"
              onClick={() => onChange([])}
              disabled={disabled}
            >
              Clear all
            </button>
          </>
        )}
      </div>

      <Autocomplete<TOption, true, false, false>
        multiple
        size="small"
        options={options}
        value={selectedOptions}
        onChange={(_, newVal) => onChange(newVal.map(getOptionValue))}
        isOptionEqualToValue={(opt, val) => getOptionValue(opt) === getOptionValue(val)}
        getOptionLabel={getOptionLabel}
        groupBy={groupBy}
        disabled={disabled}
        loading={loading}
        noOptionsText={emptyText}
        limitTags={2}
        getLimitTagsText={(more) => `+${more}`}
        disableCloseOnSelect
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={selectedOptions.length === 0 ? placeholder : undefined}
            inputProps={{ ...params.inputProps, 'aria-label': ariaLabel }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontSize: 11,
                fontFamily: 'inherit',
                background: 'var(--x-card)',
                '& fieldset': { borderColor: 'var(--x-border)' },
                '&:hover fieldset': { borderColor: 'var(--x-text-m)' },
                '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 1.5 },
                '&.Mui-disabled': { opacity: 0.55 },
              },
              '& .MuiInputBase-input': {
                fontSize: 11,
                fontFamily: 'inherit',
              },
            }}
          />
        )}
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props as { key: React.Key } & React.HTMLAttributes<HTMLLIElement>
          return (
            <li key={key} {...rest} style={{ padding: '3px 10px', fontSize: 11, fontFamily: 'inherit' }}>
              <Checkbox
                checked={selected}
                size="small"
                disableRipple
                sx={{
                  mr: 0.75, p: '2px',
                  color: 'var(--x-border)',
                  '&.Mui-checked': { color: '#16a34a' },
                }}
              />
              {getOptionLabel(option)}
            </li>
          )
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index })
            return (
              <Chip
                key={key}
                label={getOptionLabel(option)}
                size="small"
                {...tagProps}
                sx={{
                  fontSize: 9,
                  height: 18,
                  maxWidth: 160,
                  fontFamily: 'inherit',
                  '& .MuiChip-label': { px: 0.75, lineHeight: 1 },
                  '& .MuiChip-deleteIcon': { fontSize: 12, ml: 0.25 },
                }}
              />
            )
          })
        }
      />
    </div>
  )
}
