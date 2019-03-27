import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Report, ReportDetails } from '../../../model/Report';
import { BsLocaleService } from 'ngx-bootstrap';
import { otherPrecisionValue, ReportService } from '../../../services/report.service';
import { AnalyticsService, EventCategories, ReportEventActions } from '../../../services/analytics.service';
import { KeywordService } from '../../../services/keyword.service';
import { AnomalyService } from '../../../services/anomaly.service';
import { ReportRouterService, Step } from '../../../services/report-router.service';
import { Information } from '../../../model/Anomaly';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  animations: [
    trigger('openClose', [
      state('open', style({
        display: 'block',
        opacity: 1,
      })),
      state('closed', style({
        display: 'none',
        opacity: 0,
      })),
      transition('open => closed', [
        animate('0.2s ease-out')
      ]),
      transition('closed => open', [
        animate('0.5s ease-in-out')
      ]),
    ]),
  ],
})
export class DetailsComponent implements OnInit {

  step: Step;
  report: Report;

  detailsForm: FormGroup;
  singlePrecisionCtrl: FormControl;
  multiplePrecisionCtrl: FormArray;
  otherPrecisionCtrl: FormControl;
  anomalyDateCtrl: FormControl;
  anomalyTimeSlotCtrl: FormControl;
  descriptionCtrl: FormControl;

  plageHoraireList: number[];
  ticketFile: File;
  anomalyFile: File;

  showErrors: boolean;
  keywordsDetected: Keyword;

  constructor(public formBuilder: FormBuilder,
              private reportService: ReportService,
              private reportRouterService: ReportRouterService,
              private analyticsService: AnalyticsService,
              private localeService: BsLocaleService,
              private keywordService: KeywordService,
              private anomalyService: AnomalyService) {
  }

  ngOnInit() {
    this.step = Step.Details;
    this.reportService.currentReport.subscribe(report => {
      if (report) {
        this.report = report;
        this.initDetailsForm();
        this.constructPlageHoraireList();
      } else {
        this.reportRouterService.routeToFirstStep();
      }
    });
    this.localeService.use('fr');

    this.searchKeywords();

  }

  initDetailsForm() {
    this.showErrors = false;

    this.descriptionCtrl = this.formBuilder.control(this.report.details ? this.report.details.description : '');
    this.anomalyDateCtrl = this.formBuilder.control(
      this.report.details ? this.report.details.anomalyDate : new Date(), Validators.required
    );
    this.anomalyTimeSlotCtrl = this.formBuilder.control(this.report.details ? this.report.details.anomalyTimeSlot : '');

    this.detailsForm = this.formBuilder.group({
      anomalyDate: this.anomalyDateCtrl,
      anomalyTimeSlot: this.anomalyTimeSlotCtrl,
      description: this.descriptionCtrl
    });

    if (this.report.subcategory && this.report.subcategory.details && this.report.subcategory.details.precision) {
      this.initPrecisionsCtrl();
    }
  }

  initPrecisionsCtrl() {
    const subcategoryDetailsPrecision = this.report.subcategory.details.precision;
    if (subcategoryDetailsPrecision.severalOptionsAllowed) {
      this.multiplePrecisionCtrl = new FormArray(
        subcategoryDetailsPrecision.options.map(option =>
          this.formBuilder.control( this.isOptionChecked(option) ? true : false)
        )
      );
      this.detailsForm.addControl('multiplePrecision', this.multiplePrecisionCtrl);
    } else {
      this.singlePrecisionCtrl = this.formBuilder.control(
        this.report.details ? this.report.details.precision : '' , Validators.required
      );
      this.detailsForm.addControl('singlePrecision', this.singlePrecisionCtrl);
    }
    this.otherPrecisionCtrl = this.formBuilder.control(this.report.details ? this.report.details.otherPrecision : '');
    this.initOtherPrecision();
  }

  isOptionChecked(option: Information) {
    return this.report.details && this.report.details.precision && this.report.details.precision.indexOf(option.title) !== -1;
  }

  initOtherPrecision() {
    if (this.getPrecisionFromCtrl().indexOf(otherPrecisionValue) !== -1) {
      this.detailsForm.addControl('otherPrecision', this.otherPrecisionCtrl);
    } else {
      this.detailsForm.removeControl('otherPrecision');
    }
  }

  constructPlageHoraireList() {
    this.plageHoraireList = [];
    for (let i = 0; i < 24; i++) {
      this.plageHoraireList.push(i);
    }
  }

  onTicketFileSelected(file: File) {
    this.ticketFile = file;
  }

  onAnomalyFileSelected(file: File) {
    this.anomalyFile = file;
  }

  submitDetailsForm() {

    if (!this.detailsForm.valid) {
      this.showErrors = true;
    } else {
        this.analyticsService.trackEvent(EventCategories.report, ReportEventActions.validateDetails);
        const reportDetails = new ReportDetails();
        if (this.getPrecisionFromCtrl()) {
          reportDetails.precision = this.getPrecisionFromCtrl();
        }
        if (this.getPrecisionFromCtrl().indexOf(otherPrecisionValue) !== -1 && this.otherPrecisionCtrl) {
          reportDetails.otherPrecision = this.otherPrecisionCtrl.value;
        }
        reportDetails.anomalyDate = this.anomalyDateCtrl.value;
        reportDetails.anomalyTimeSlot = this.anomalyTimeSlotCtrl.value;
        reportDetails.description = this.descriptionCtrl.value;
        reportDetails.ticketFile = this.ticketFile;
        reportDetails.anomalyFile = this.anomalyFile;
        this.report.details = reportDetails;
        this.reportService.changeReportFromStep(this.report, this.step);
        this.reportRouterService.routeForward(this.step);
    }
  }

  getPrecisionFromCtrl() {
    if (this.singlePrecisionCtrl) {
      return this.singlePrecisionCtrl.value;
    } else if (this.multiplePrecisionCtrl) {
      return this.multiplePrecisionCtrl.controls
        .map((control, index) => {
          return control.value ? this.report.subcategory.details.precision.options[index].title : null;
        })
        .filter(value => value !== null);
    } else {
      return '';
    }
  }

  searchKeywords() {

    const res = this.keywordService.search(this.descriptionCtrl.value);
    
    if (res) {
      const anomaly = this.anomalyService.getAnomalyByCategoryId(res.categoryId);
  
      if (anomaly) {
        this.analyticsService.trackEvent(EventCategories.report, ReportEventActions.keywordsDetection, JSON.stringify(res.found.map(elt => elt.expression)));
        
        this.keywordsDetected = {
          category: anomaly.category,
          message: anomaly.information ? anomaly.information.title : ''
        };
      } else {
        this.keywordsDetected = null;
      }

    }
  }

  goToInformationPage() {
    // modification des éléments du report et du step pour que le router affiche la page d'info avec le contexte
    this.step = Step.Category;
    this.report.category = this.keywordsDetected.category;
    this.report.subcategory = null;

    this.reportService.changeReportFromStep(this.report, this.step);
    this.reportRouterService.routeForward(this.step);

  }
}

interface Keyword {
  readonly category: string;
  readonly message: string;
}
