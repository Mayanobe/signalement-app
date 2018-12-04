import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './pages/header/header.component';
import { SignalementFormComponent } from './pages/signalement-form/signalement-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { defineLocale, frLocale } from 'ngx-bootstrap';
import { FileInputComponent } from './components/file-input/file-input.component';
import { Ng2CompleterModule } from 'ng2-completer';
import { CompanyFormComponent } from './pages/company-form/company-form.component';

defineLocale('fr', frLocale);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SignalementFormComponent,
    FileInputComponent,
    CompanyFormComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BsDatepickerModule.forRoot(),
    Ng2CompleterModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
