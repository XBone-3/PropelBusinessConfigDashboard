import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, Observable } from 'rxjs';

interface IDialogConfig {
  data?: any;
  width?: string;
  height?: string;
  enterAnimationDuration?: string;
  exitAnimationDuration?: string;
}
@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(
    private dialog: MatDialog,

  ) { }

  /**
   * Opens the dialog with the specified component and configuration.
   *
   * @param {any} component - The component to be displayed in the dialog.
   * @param {DialogConfig} dialogConfig - The configuration for the dialog.
   * @param {any} dialogConfig.data - The data to be passed to the component.
   * @param {string} [dialogConfig.width='auto'] - The width of the dialog.
   * @param {string} [dialogConfig.height='130px'] - The height of the dialog.
   * @param {string} [dialogConfig.enterAnimationDuration='0ms'] - The duration of the enter animation for the dialog.
   * @param {string} [dialogConfig.exitAnimationDuration='0ms'] - The duration of the exit animation for the dialog.
   * @returns {Observable<any>} - An observable that emits the result of the dialog close.
   */
  openDialog(component: any, dialogConfig: IDialogConfig = {}): Observable<any> {
    const {
      data = {},
      width = 'auto',
      height = '130px',
      enterAnimationDuration = '0ms',
      exitAnimationDuration = '0ms'
    } = dialogConfig;

    const dialogRef = this.dialog.open(component, {
      data,
      width,
      height,
      enterAnimationDuration,
      exitAnimationDuration
    });

    // filters out null, undefined, empty string,0, NaN and false results from the dialog close.
    return dialogRef.afterClosed().pipe(
      filter((result) => result)
    );
  }
}