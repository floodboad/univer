import { zh as DocPluginZh } from '@univerjs/base-docs';
import { zh as SheetPluginZh } from '@univerjs/base-sheets';
import { zh as UIPluginZh } from '@univerjs/base-ui';
import { zh as FindPluginZh } from '@univerjs/sheets-plugin-find';
import { zh as ImportXlsxPluginZh } from '@univerjs/sheets-plugin-import-xlsx';
import { zh as NumberfmtPluginZh } from '@univerjs/sheets-plugin-numfmt';
import { zh as DocUIPluginZh } from '@univerjs/ui-plugin-docs';
import { zh as SheetUIPluginZh } from '@univerjs/ui-plugin-sheets';

export const locales = {
    zh: {
        ...DocPluginZh,
        ...SheetPluginZh,
        ...UIPluginZh,
        ...FindPluginZh,
        ...ImportXlsxPluginZh,
        ...NumberfmtPluginZh,
        ...DocUIPluginZh,
        ...SheetUIPluginZh,
    },
};