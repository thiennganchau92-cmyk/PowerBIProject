import { StyleConfig } from "../state/StateTypes";
import { VisualFormattingSettingsModel } from "../settings";

/**
 * Centralized style management service
 * Provides consistent styling across all components
 */
export class StyleService {
    /**
     * Create a style configuration from formatting settings
     * @param settings Visual formatting settings
     * @returns Style configuration object
     */
    static createStyleConfig(settings: VisualFormattingSettingsModel): StyleConfig {
        return {
            fontSize: settings.dataPointCard.fontSize.value,
            defaultColor: settings.dataPointCard.defaultColor.value?.value,
            fill: settings.dataPointCard.fill.value?.value,
            fillRule: settings.dataPointCard.fillRule.value?.value
        };
    }

    /**
     * Apply base styles to a component element
     * @param element HTML element to style
     * @param config Style configuration
     */
    static applyComponentStyles(element: HTMLElement, config: StyleConfig): void {
        if (config.fontSize) {
            element.style.fontSize = `${config.fontSize}px`;
        }
        if (config.defaultColor) {
            element.style.color = config.defaultColor;
        }
    }

    /**
     * Apply selection styles to an element
     * @param element HTML element to style
     * @param isSelected Whether the element is selected
     * @param config Style configuration
     */
    static applySelectionStyles(
        element: HTMLElement,
        isSelected: boolean,
        config: StyleConfig
    ): void {
        if (isSelected) {
            element.classList.add("selected");
            element.setAttribute("aria-selected", "true");

            if (config.fill) {
                element.style.backgroundColor = config.fill;
            }
            if (config.fillRule) {
                element.style.color = config.fillRule;
            }
        } else {
            element.classList.remove("selected");
            element.setAttribute("aria-selected", "false");
            element.style.backgroundColor = "";
            element.style.color = config.defaultColor || "";
        }
    }

    /**
     * Apply text styles to a label element
     * @param label HTML element to style
     * @param config Style configuration
     */
    static applyLabelStyles(label: HTMLElement, config: StyleConfig): void {
        label.style.fontSize = `${config.fontSize}px`;
        if (config.defaultColor) {
            label.style.color = config.defaultColor;
        }
    }

    /**
     * Apply styles to a button element
     * @param button HTML element to style
     * @param config Style configuration
     */
    static applyButtonStyles(button: HTMLElement, config: StyleConfig): void {
        button.style.fontSize = `${config.fontSize}px`;
        if (config.defaultColor) {
            button.style.color = config.defaultColor;
        }
    }

    /**
     * Apply styles to selected item chips
     * @param chip HTML element to style
     * @param config Style configuration
     */
    static applyChipStyles(chip: HTMLElement, config: StyleConfig): void {
        if (config.fill) {
            chip.style.backgroundColor = config.fill;
        }
        if (config.fillRule) {
            chip.style.color = config.fillRule;
        }
        chip.style.fontSize = `${config.fontSize}px`;
    }

    /**
     * Remove all custom styles from an element
     * @param element HTML element to reset
     */
    static resetStyles(element: HTMLElement): void {
        element.style.fontSize = "";
        element.style.color = "";
        element.style.backgroundColor = "";
    }
}
