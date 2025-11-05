/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Panel Settings Card
 */
class PanelCardSettings extends FormattingSettingsCard {
    scope = new formattingSettings.ItemDropdown({
        name: "scope",
        displayName: "Filter Scope",
        items: [
            { displayName: "Visual", value: "Visual" },
            { displayName: "Page", value: "Page" },
            { displayName: "Report", value: "Report" }
        ],
        value: { displayName: "Page", value: "Page" }
    });

    applyMode = new formattingSettings.ItemDropdown({
        name: "applyMode",
        displayName: "Apply Mode",
        items: [
            { displayName: "Instant", value: "Instant" },
            { displayName: "Commit", value: "Commit" }
        ],
        value: { displayName: "Instant", value: "Instant" }
    });

    showActiveChips = new formattingSettings.ToggleSwitch({
        name: "showActiveChips",
        displayName: "Show Active Filters",
        value: true
    });

    showReset = new formattingSettings.ToggleSwitch({
        name: "showReset",
        displayName: "Show Reset Button",
        value: true
    });

    denseMode = new formattingSettings.ToggleSwitch({
        name: "denseMode",
        displayName: "Dense Mode",
        value: false
    });

    enableCrossFiltering = new formattingSettings.ToggleSwitch({
        name: "enableCrossFiltering",
        displayName: "Enable Filter Relationships",
        description: "When enabled, filters interact with each other - applying one filter updates available options in other filters",
        value: true
    });

    initialState = new formattingSettings.ItemDropdown({
        name: "initialState",
        displayName: "Initial Panel State",
        items: [
            { displayName: "Visible", value: "Visible" },
            { displayName: "Hidden", value: "Hidden" }
        ],
        value: { displayName: "Visible", value: "Visible" }
    });

    layout = new formattingSettings.ItemDropdown({
    name: "layout",
    displayName: "Layout",
    items: [
    { displayName: "Vertical", value: "Vertical" },
    { displayName: "Horizontal", value: "Horizontal" }
    ],
    value: { displayName: "Vertical", value: "Vertical" }
    });

    filterLayout = new formattingSettings.ItemDropdown({
        name: "filterLayout",
        displayName: "Filter Controls Layout",
        items: [
            { displayName: "Vertical", value: "Vertical" },
            { displayName: "Horizontal", value: "Horizontal" }
        ],
        value: { displayName: "Vertical", value: "Vertical" }
    });

    bookmarkResetTrigger = new formattingSettings.ToggleSwitch({
        name: "bookmarkResetTrigger",
        displayName: "Bookmark Reset Trigger",
        description: "Toggle this to reset all filters via bookmark. Create bookmarks with different values to trigger reset.",
        value: false
    });

    name: string = "panelSettings";
    displayName: string = "Panel Settings";
    slices: Array<FormattingSettingsSlice> = [this.scope, this.applyMode, this.showActiveChips, this.showReset, this.denseMode, this.enableCrossFiltering, this.initialState, this.layout, this.filterLayout, this.bookmarkResetTrigger];
}

/**
 * Theming Card
 */
class ThemingCardSettings extends FormattingSettingsCard {
    accentColor = new formattingSettings.ColorPicker({
        name: "accentColor",
        displayName: "Accent Color",
        value: { value: "#0A400C" }
    });

    chipStyle = new formattingSettings.ItemDropdown({
        name: "chipStyle",
        displayName: "Chip Style",
        items: [
            { displayName: "Rounded", value: "Rounded" },
            { displayName: "Square", value: "Square" }
        ],
        value: { displayName: "Rounded", value: "Rounded" }
    });

    borderRadius = new formattingSettings.NumUpDown({
        name: "borderRadius",
        displayName: "Border Radius",
        value: 4
    });

    name: string = "theming";
    displayName: string = "Theming";
    slices: Array<FormattingSettingsSlice> = [this.accentColor, this.chipStyle, this.borderRadius];
}

/**
* visual settings model class
*
*/
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    panelSettingsCard = new PanelCardSettings();
    themingCard = new ThemingCardSettings();

    cards = [this.panelSettingsCard, this.themingCard];
}
