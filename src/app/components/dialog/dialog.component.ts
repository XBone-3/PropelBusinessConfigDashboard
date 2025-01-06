import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FormsModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatOptionModule,
    FormsModule,
    ReactiveFormsModule,
    MatRadioModule
  ]
})
export class DialogComponent {
  isEditing = false;
  isNewValue = false;
  inputControl: FormControl;
  selectedOption: any;

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.inputControl = new FormControl(data?.initialValue || '');
  }

  startEditing(): void {
    this.isEditing = true;
    this.inputControl.setValue(this.selectedOption);
  }

  saveValue(): void {
    if (this.isEditing && this.inputControl.value) {
      const index = this.data.options.findIndex((option: any) => option === this.selectedOption);
      this.dialogRef.close({
        value: this.inputControl.value,
        index,
        type: 'edit'
      });
    }

    else if (this.isNewValue && this.inputControl.value) {
      this.dialogRef.close({
        value: this.inputControl.value,
        index: -1,
        type: 'new'
      });
    }

    else if (this.selectedOption) {
      const index = this.data.options.findIndex((option: any) => option === this.selectedOption);
      this.dialogRef.close({
        value: this.selectedOption,
        index,
        type: 'select'
      });
    }

  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onNew(): void {
    this.isNewValue = true;
    this.inputControl.setValue('');
  }
}