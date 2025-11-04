import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
/**
 * Panel Settings Card
 */
declare class PanelCardSettings extends FormattingSettingsCard {
    scope: formattingSettings.ItemDropdown;
    applyMode: formattingSettings.ItemDropdown;
    showActiveChips: formattingSettings.ToggleSwitch;
    showReset: formattingSettings.ToggleSwitch;
    denseMode: formattingSettings.ToggleSwitch;
    enableCrossFiltering: formattingSettings.ToggleSwitch;
    initialState: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
/**
 * Theming Card
 */
declare class ThemingCardSettings extends FormattingSettingsCard {
    accentColor: formattingSettings.ColorPicker;
    chipStyle: formattingSettings.ItemDropdown;
    borderRadius: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
/**
* visual settings model class
*
*/
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    panelSettingsCard: PanelCardSettings;
    themingCard: ThemingCardSettings;
    cards: (PanelCardSettings | ThemingCardSettings)[];
}
export {};
