import { CommonModule, JsonPipe, KeyValue, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NavigationEnd, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfigField } from '../../interfaces/config.interface';
import { EnvConfigService } from '../../services/env-config.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { EnvPreviewComponent } from '../env-preview/env-preview.component';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkeltonLoaderComponent } from '../skelton-loader/skelton-loader.component';
import { referenceConfig } from '../../ebs_config';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { referenceCloudConfig } from '../../cloud_config';
import { DialogComponent } from '../dialog/dialog.component';


@Component({
  selector: 'app-env-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    NgFor,
    NgIf,
    JsonPipe,
    CommonModule,
    MatDialogModule,
    TooltipComponent,
    EnvPreviewComponent,
    SkeltonLoaderComponent,
    ConfirmationDialogComponent,
    ToastrModule,
  ],
  templateUrl: './env-form.component.html',
  styleUrl: './env-form.component.scss'
})
export class EnvFormComponent {
  envForm: FormGroup = new FormGroup({});
  groupedFields: any = {};
  envFormPreview: any;
  loading: boolean = false;
  getBusinessConfigEbs: any
  currentParamValue: string = '';
  field: any;
  selectedValue: string = '';
  private currentDialog: MatDialogRef<any> | null = null;

  constructor(
    private fb: FormBuilder,
    private configService: EnvConfigService,
    public dialog: MatDialog,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const route = event.urlAfterRedirects;
        console.log(route);
        this.handleRoute(route);
        this.currentParamValue = route;
      }
    })
  }


  createFormGroup(config: any): any {
    const group: any = {};
    for (const category in config) {
      if (config.hasOwnProperty(category)) {
        config[category].forEach((field: ConfigField) => {
          let value = field.currentValue || field.defaultValue;
          if (field.type === 'boolean') {
            value = value === 'true' || value === true;
          }
          group[field.name] = [value];
        });
      }
    }
    return group;
  }
  // Sort the form fields in the order they appear in the JSON (from the backend)
  originalOrder = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => 0;

  async getEBSConfig(applicationType: string = 'EBS'): Promise<void> {
    this.loading = true;
    this.getBusinessConfigEbs = await firstValueFrom(this.configService.getConfig(applicationType));
    if (!Object.entries(this.getBusinessConfigEbs).length) {
      this.loading = false;
      return;
    }
    const EBS_CONFIG: any = Object.entries(this.getBusinessConfigEbs).map(([key, value]) => {
      return {
        modificationName: key,
        name: key,
        defaultValue: value,
        currentValue: value
      };
    });

    const updatedEBSConfig = EBS_CONFIG.map((item: any) => {
      const matchedConfig: any = referenceConfig.find(ref => ref.name === item.modificationName);
      if (Object.entries(matchedConfig).length) {
        item.modificationName = matchedConfig?.defaultName;
        item.type = matchedConfig?.type;
        item.required = matchedConfig.required;
        item.description = matchedConfig.description;
        item.options = matchedConfig.options || [];
      }
      return item;

    });
    this.groupedFields = { EBS_CONFIG: updatedEBSConfig };
    this.envForm = this.fb.group(this.createFormGroup({ EBS_CONFIG: updatedEBSConfig }));
    this.envFormPreview = this.envForm.value;
    this.loading = false;
  }

  async getCloudConfig(applicationType: string = 'CLOUD'): Promise<void> {
    this.loading = true;
    const getBusinessConfigCloud = await firstValueFrom(this.configService.getConfig(applicationType));
    if (!Object.entries(getBusinessConfigCloud).length) {
      this.loading = false;
      return;
    }
    const CLOUD_CONFIG: any = Object.entries(getBusinessConfigCloud).map(([key, value]: any) => {
      return {
        modificationName: key,
        name: key,
        defaultValue: value,
        currentValue: (Array.isArray(value) || (typeof value === 'object' && Object.entries(value).length)) ? key : value,
        options: Array.isArray(value) ? value : [] 
      };
    });
    const updatedCloudConfig = CLOUD_CONFIG.map((item: any) => {
      const matchedConfig: any = referenceCloudConfig.find(ref => ref.name === item.modificationName);
      if (Object.entries(matchedConfig).length) {
        item.modificationName = matchedConfig?.defaultName;
        item.type = matchedConfig?.type;
        item.required = matchedConfig.required;
        item.description = matchedConfig.description;
        item.options = matchedConfig.options || [];
      }
      return item;
    });

    this.groupedFields = { CLOUD_CONFIG: updatedCloudConfig };
    this.envForm = this.fb.group(this.createFormGroup({ CLOUD_CONFIG: updatedCloudConfig }));
    this.envFormPreview = this.envForm.value;
    this.loading = false;
  }
 
  openDialog(field: any): void {
    const resp = field.options.find((option: any) => option.toLowerCase() === 'true');
    if (resp) {
      return;
    }

    const dialogConfig = {
      data: {
        ...field,
        currentValue: this.envForm.get(field.name)?.value
      },
      width: 'auto',
      height: '240px'
    };

    this.currentDialog = this.dialog.open(DialogComponent, dialogConfig);
    this.currentDialog.afterClosed().subscribe((result) => {
      if (!result?.value) {
        return;
      }
      this.updateFieldValue(field, result);
    });
  }

  updateFieldValue(field: any, result: any): void {
    if (!field || !field.options) {
      console.error('Field or options are undefined');
      return;
    }
    if (result.type === 'new') {
      field.options = [...field.options, result.value];
      this.envForm.get(field.name)?.setValue(result.value);
    }
    else if (result.type === 'edit') {
      field.options = field.options.map((option: any, index: number) => {
        if (index === result.index) {
          return result.value;
        }
        return option;
      });
      this.envForm.get(field.name)?.setValue(result.value);
    }
    else if (result.type === 'select') {
      this.envForm.get(field.name)?.setValue(result.value);
    }
    this.cdr.detectChanges();
  }
  handleRoute(route: string | undefined): void {
    switch (route) {
      case '/EBS':
        this.getEBSConfig('EBS');
        break;
      case '/CLOUD':
        this.getCloudConfig('CLOUD');
        break;
      default:
        this.getEBSConfig('CLOUD');
    }
  }

  async onSubmit(): Promise<void> {
    const applicationType = this.currentParamValue.substring(1);
  
    this.loading = true; 
    if (this.envForm.valid) {
      const formValue = this.envForm.value;
      const transformedPayload = this.transformFormValues(formValue);
      const requestPayload = {
        Input: [transformedPayload]
      };
  
      try {
        const res = await firstValueFrom(
          this.configService.performSaveConfigTransaction(requestPayload, applicationType)
        );
        console.info(res);
        if (res[0].ReturnStatus.toLowerCase() === 's') {
          this.toastr.success('Business config Updated Successfully', 'Success');
          console.log('res Success, ', res);
          setTimeout(
            async () => {
              const businessConfig = await firstValueFrom(this.configService.getConfig(applicationType));
              console.log('Updated Business Config:', businessConfig);
              this.envForm.setValue(businessConfig);
              this.envFormPreview = this.envForm.value;   
            }, 1000 * 10
          );
  
        } else {
          console.log('res Fail, ', res);
          this.toastr.error('Business config Update Failed', 'Error');
        }
  
      } catch (err) {
        console.error(err);
        this.toastr.error('An error occurred while updating the configuration.', 'Error');
      } finally {
        this.loading = false; 
      }
    }
  }
  
  transformFormValues(formValue: any) {
    const transformedValue: any = {};
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (typeof value === 'string') {
        if (value === 'true' || value === 'false') {
          transformedValue[key] = value === 'true'; 
        } else if (!isNaN(Number(value))) {
          transformedValue[key] = Number(value);  
        } else {
          transformedValue[key] = value;  
        }
      } else {
        transformedValue[key] = value;
      }
    });
  
    return transformedValue;
  }
  
  buildPayload(payload: any, applicationType: string) {
    return
  }
}