"use client"
import { BREAKPOINTS } from "@shared/config/BREAKPOINTS";
import { useRouter } from "next/navigation";
import React, { useEffect,useState } from "react";
import { useTranslation } from "react-i18next";
import Select, { components } from "react-select";

const DropdownChevron = (props) => (
  <components.DropdownIndicator {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8.59961 0.799805L4.59961 3.7998L0.599609 0.799805"
        stroke="#0D0D0D"
        strokeWidth="2"
      />
    </svg>
  </components.DropdownIndicator>
);

const PROFILE_BORDER_DEFAULT = "rgba(153, 153, 153, 0.5)";
const PROFILE_BORDER_FOCUSED = "var(--Dark, #1A1A1A)";
const PROFILE_VALUE_TEXT = {
  color: "var(--Dark, #0D0D0D)",
  fontFamily: "var(--font-body)",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "20px",
};

export default function AutoCompleteSelect({
  isProduct = false,
  variant = "checkout",
  id,
  label,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  options,
  error,
  touched,
  routeBase = "/product",
  routeCategory,
  onSelectOption,
  placeholder,
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  
  const [menuTarget, setMenuTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMenuTarget(document.body);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINTS.mobileMax}px)`);
    const update = () => setIsMobile(Boolean(mq.matches));
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    // Safari fallback
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  const handleChange = (selectedOption) => {
    if (isProduct) {
      if (selectedOption && selectedOption.value) {
        router.push(`${routeBase}/${routeCategory}/${selectedOption.value}`);
      }
      return;
    }

    if (onSelectOption) {
      onSelectOption(selectedOption);
    } else {
      onChange({
        target: {
          name,
          value: selectedOption ? selectedOption.value : "",
        },
      });
    }
  };

  const selectedOption = options?.find((opt) => opt.value === value) 
    || (value ? { value: value, label: value } : null);

  const finalPlaceholder = placeholder || (isProduct ? label : t("choose"));
  const controlFontSize = isMobile ? "14px" : "16px";
  const isProfile = variant === "profile";

  const profileControlHeight = isMobile && isProfile ? "48px" : "53px";

  const getProfileValueDisplayStyles = (color = PROFILE_VALUE_TEXT.color) => ({
    ...PROFILE_VALUE_TEXT,
    fontSize: controlFontSize,
    color,
    margin: 0,
    position: "relative",
    top: 0,
    transform: "none",
    gridArea: "unset",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });

  const getControlStyles = (base, state) => {
    if (isProfile) {
      const borderColor = state.isFocused
        ? PROFILE_BORDER_FOCUSED
        : PROFILE_BORDER_DEFAULT;

      return {
        ...base,
        borderRadius: "0px",
        background: "#fff",
        backdropFilter: "none",
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        height: profileControlHeight,
        minHeight: profileControlHeight,
        padding: 0,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor,
        boxShadow: "none",
        "&:hover": {
          borderColor,
          background: "#fff",
        },
      };
    }

    return {
      ...base,
      borderRadius: "0px",
      background: "rgba(254, 254, 254, 0.70)",
      backdropFilter: "blur(4px)",
      height: "53px",
      borderColor: state.isFocused ? "#FF99D6" : "rgba(0, 0, 0, 0.1)",
      boxShadow: state.isFocused ? "0 0 0 1px #FF99D6" : "none",
      "&:hover": {
        borderColor: "#FF99D6",
        background: "rgba(254, 254, 254, 0.85)",
      },
    };
  };

  const getValueTextStyles = (base) => ({
    ...base,
    ...(isProfile
      ? PROFILE_VALUE_TEXT
      : {
          color: "var(--Dark, #0D0D0D)",
          fontFamily: "var(--font-body)",
          fontSize: controlFontSize,
          fontStyle: "normal",
          fontWeight: 600,
          lineHeight: "normal",
        }),
  });

  const getOptionStyles = (base, state) => {
    if (isProfile) {
      const hoverBg = "rgba(26, 26, 26, 0.08)";
      const selectedBg = "rgba(26, 26, 26, 0.12)";

      return {
        ...base,
        borderRadius: "0px",
        padding: "0 16px",
        margin: "2px 0",
        ...PROFILE_VALUE_TEXT,
        fontSize: controlFontSize,
        backgroundColor: state.isSelected
          ? selectedBg
          : state.isFocused
            ? hoverBg
            : "transparent",
        cursor: "pointer",
        "&:active": {
          backgroundColor: hoverBg,
          color: PROFILE_VALUE_TEXT.color,
        },
      };
    }

    return {
      ...base,
      borderRadius: "0px",
      padding: "0 16px",
      margin: "2px 0",
      fontSize: controlFontSize,
      backgroundColor: state.isSelected
        ? "#FF99D6"
        : state.isFocused
          ? "rgba(255, 153, 214, 0.1)"
          : "transparent",
      color: state.isSelected ? "white" : "#333",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#FF99D6",
        color: "white",
      },
    };
  };

  return (
    <div className="custom-select-wrapper">
      <label htmlFor={id} className="custom-select-label">
        {label}
      </label>
      <Select
        instanceId={id} 
        inputId={id}
        name={name}
        className="select-new-post"
        classNamePrefix="react-select"
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onBlur={!isProduct ? onBlur : undefined}
        isDisabled={disabled}
        isSearchable={!isProfile}
        placeholder={finalPlaceholder}
        menuPortalTarget={menuTarget}
        components={{
          IndicatorSeparator: null,
          DropdownIndicator: DropdownChevron,
        }}
        styles={{
          control: getControlStyles,
          valueContainer: (base) =>
            isProfile
              ? {
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "stretch",
                  flex: "1 1 0%",
                  flexWrap: "nowrap",
                  width: 0,
                  minWidth: 0,
                  height: "100%",
                  padding: isMobile ? "0 4px 0 12px" : "0 8px 0 16px",
                  overflow: "hidden",
                  position: "relative",
                }
              : {
                  ...base,
                  padding: "0 0 0 16px",
                },
          indicatorsContainer: (base) =>
            isProfile
              ? {
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  alignSelf: "center",
                  flexShrink: 0,
                  height: "100%",
                  padding: isMobile ? "0 8px 0 0" : "0 10px 0 0",
                }
              : {
                  ...base,
                  padding: "0 12px 0 0",
                },
          dropdownIndicator: (base) =>
            isProfile
              ? {
                  ...base,
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "center",
                  padding: 0,
                }
              : base,
          placeholder: (base) =>
            isProfile
              ? getProfileValueDisplayStyles("#9CA3AF")
              : {
                  ...base,
                  color: "#999",
                  fontSize: controlFontSize,
                },
          singleValue: (base) =>
            isProfile ? getProfileValueDisplayStyles() : getValueTextStyles(base),
          indicatorSeparator: () => ({ display: "none" }),
          input: (base) =>
            isProfile
              ? {
                  ...PROFILE_VALUE_TEXT,
                  fontSize: controlFontSize,
                  margin: 0,
                  padding: 0,
                  minHeight: 0,
                }
              : getValueTextStyles(base),
          menuPortal: (base) => ({ 
            ...base, 
            zIndex: 9999 
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "0px",
            background: "rgba(254, 254, 254, 0.95)", 
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            marginTop: "8px", 
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            borderRadius: "0px",
          }),
          option: getOptionStyles,
        }}
        filterOption={(option, inputValue) =>
          option.label.toLowerCase().includes(inputValue.toLowerCase())
        }
      />
      {!isProduct && error && touched && <div className="error">{error}</div>}
    </div>
  );
}