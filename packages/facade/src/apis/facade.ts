/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CommandListener, IExecutionOptions, IWorkbookData, Nullable } from '@univerjs/core';
import {
    BorderStyleTypes,
    ICommandService,
    IUniverInstanceService,
    UndoCommand,
    Univer,
    WrapStrategy,
} from '@univerjs/core';
import { ISocketService, WebSocketService } from '@univerjs/network';
import type { IRegisterFunctionParams, IUnregisterFunctionParams } from '@univerjs/sheets-formula';
import { IRegisterFunctionService } from '@univerjs/sheets-formula';
import type { IDisposable } from '@wendellhu/redi';
import { Inject, Injector, Quantity } from '@wendellhu/redi';

import type { RenderComponentType, SheetComponent, SheetExtension } from '@univerjs/engine-render';
import { IRenderManagerService, RenderManagerService } from '@univerjs/engine-render';
import { SHEET_VIEW_KEY } from '@univerjs/sheets-ui';
import { FWorkbook } from './sheet/f-workbook';

export class FUniver {
    /**
     * Create a FUniver instance, if the injector is not provided, it will create a new Univer instance.
     */
    static newAPI(wrapped: Univer | Injector): FUniver {
        const injector = wrapped instanceof Univer ? wrapped.__getInjector() : wrapped;
        // Is unified registration required?
        const socketService = injector.get(ISocketService, Quantity.OPTIONAL);
        if (!socketService) {
            injector.add([ISocketService, { useClass: WebSocketService }]);
        }

        const renderManagerService = injector.get(IRenderManagerService, Quantity.OPTIONAL);
        if (!renderManagerService) {
            injector.add([IRenderManagerService, { useClass: RenderManagerService }]);
        }

        return injector.createInstance(FUniver);
    }

    static BorderStyle = BorderStyleTypes;
    static WrapStrategy = WrapStrategy;

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService,
        @ICommandService private readonly _commandService: ICommandService,
        @IRegisterFunctionService private readonly _registerFunctionService: IRegisterFunctionService,
        @ISocketService private readonly _ws: ISocketService,
        @IRenderManagerService private readonly _renderManagerService: IRenderManagerService
    ) {}

    /**
     * Create a new spreadsheet and get the API handler of that spreadsheet.
     * @param data the snapshot of the spreadsheet.
     * @returns Spreadsheet API instance.
     */
    createUniverSheet(data: Partial<IWorkbookData>): FWorkbook {
        const workbook = this._univerInstanceService.createSheet(data);
        return this._injector.createInstance(FWorkbook, workbook);
    }

    /**
     * Get the spreadsheet API handler by the spreadsheet id.
     * @param id the spreadsheet id.
     * @returns Spreadsheet API instance.
     */
    getUniverSheet(id: string): FWorkbook | null {
        const workbook = this._univerInstanceService.getUniverSheetInstance(id);
        if (!workbook) {
            return null;
        }

        return this._injector.createInstance(FWorkbook, workbook);
    }

    /**
     * Get the currently focused Univer spreadsheet.
     * @returns the currently focused Univer spreadsheet.
     */
    getActiveWorkbook(): FWorkbook | null {
        const workbook = this._univerInstanceService.getCurrentUniverSheetInstance();
        if (!workbook) {
            return null;
        }

        return this._injector.createInstance(FWorkbook, workbook);
    }

    /**
     * Register a function to the spreadsheet.
     * @param config
     */
    registerFunction(config: IRegisterFunctionParams) {
        this._registerFunctionService.registerFunctions(config);
    }

    /**
     * Unregister a function from the spreadsheet.
     * @param config
     */
    unregisterFunction(config: IUnregisterFunctionParams) {
        this._registerFunctionService.unregisterFunctions(config);
    }

    /**
     * Register sheet row header render extensions.
     * @param unitId
     * @param extensions
     */
    registerSheetRowHeaderExtension(unitId: string, ...extensions: SheetExtension[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.ROW) as SheetComponent;

        sheetComponent.register(...extensions);
    }

    /**
     * Unregister sheet row header render extensions.
     * @param unitId
     * @param uKeys
     */
    unregisterSheetRowHeaderExtension(unitId: string, ...uKeys: string[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.ROW) as SheetComponent;

        sheetComponent.unRegister(...uKeys);
    }

    /**
     * Register sheet column header render extensions.
     * @param unitId
     * @param extensions
     */
    registerSheetColumnHeaderExtension(unitId: string, ...extensions: SheetExtension[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.COLUMN) as SheetComponent;
        sheetComponent.register(...extensions);
    }

    /**
     * Unregister sheet column header render extensions.
     * @param unitId
     * @param uKeys
     */
    unregisterSheetColumnHeaderExtension(unitId: string, ...uKeys: string[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.COLUMN) as SheetComponent;
        sheetComponent.unRegister(...uKeys);
    }

    /**
     * Register sheet main render extensions.
     * @param unitId
     * @param uKeys
     */
    registerSheetMainExtension(unitId: string, ...extensions: SheetExtension[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.MAIN) as SheetComponent;
        sheetComponent.register(...extensions);
    }

    /**
     * Unregister sheet main render extensions.
     * @param unitId
     * @param uKeys
     */
    unregisterSheetMainExtension(unitId: string, ...uKeys: string[]) {
        const sheetComponent = this._getSheetRenderComponent(unitId, SHEET_VIEW_KEY.MAIN) as SheetComponent;
        sheetComponent.unRegister(...uKeys);
    }

    // #region

    /**
     * Undo an editing on the currently focused document.
     * @returns redo result
     */
    undo(): Promise<boolean> {
        return this._commandService.executeCommand(UndoCommand.id);
    }

    /**
     * Redo an editing on the currently focused document.
     * @returns redo result
     */
    redo(): Promise<boolean> {
        return this._commandService.executeCommand(UndoCommand.id);
    }

    // #endregion

    // #region editing

    // #callback

    // #region listeners

    /**
     * Register a callback that will be triggered before invoking a command.
     * @param callback the callback.
     * @returns A function to dispose the listening.
     */
    onBeforeCommandExecute(callback: CommandListener): IDisposable {
        return this._commandService.beforeCommandExecuted((command, options?: IExecutionOptions) => {
            callback(command, options);
        });
    }

    /**
     * Register a callback that will be triggered when a command is invoked.
     * @param callback the callback.
     * @returns A function to dispose the listening.
     */
    onCommandExecuted(callback: CommandListener): IDisposable {
        return this._commandService.onCommandExecuted((command, options?: IExecutionOptions) => {
            callback(command, options);
        });
    }

    /**
     * Execute command
     * @param id Command id
     * @param params Command params
     * @param options Command options
     * @returns Command Promise
     */
    executeCommand<P extends object = object, R = boolean>(
        id: string,
        params?: P,
        options?: IExecutionOptions
    ): Promise<R> {
        return this._commandService.executeCommand(id, params, options);
    }

    /**
     * Set WebSocket URL for WebSocketService
     * @param url WebSocketService URL
     * @returns WebSocket info and callback
     */
    createSocket(url: string) {
        const ws = this._ws.createSocket(url);

        if (!ws) {
            throw new Error('[WebSocketService]: failed to create socket!');
        }

        return ws;
    }

    /**
     * Get sheet render component from render by unitId and view key.
     * @param unitId
     * @returns
     */
    private _getSheetRenderComponent(unitId: string, viewKey: SHEET_VIEW_KEY): Nullable<RenderComponentType> {
        const render = this._renderManagerService.getRenderById(unitId);

        if (!render) {
            throw new Error('Render not found');
        }

        const { components } = render;

        const renderComponent = components.get(viewKey);

        if (!renderComponent) {
            throw new Error('Render component not found');
        }

        return renderComponent;
    }

    // @endregion
}
