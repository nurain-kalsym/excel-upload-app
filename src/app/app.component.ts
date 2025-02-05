import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { DailyResponseModel, RequestModel, ResponseModel } from './app.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'excel-upload-app';
  selectedFile: File | null = null;
  buyerMembershipId: string = '';
  totalAmount: number | null = null;
  selectedMode: string = '';

  //exportData: RequestModel[] = [];
  exportHeaders: string[] = [];

  emptyBoolean: boolean = false;
  emptyError: string = "No file selected. Please choose one."

  stagingApiUrl = '';
  localApiUrl = 'http://localhost:8050/api/v1/memberships/simulate-incentive'; // Local Backend URL

  responseHeader: string[] = ["Membership ID", "Level", "Rank Code", "State", "Percentage", "Total Incentive", "Remarks"];
  responseData: ResponseModel[] = [];
  dailyResponseData: DailyResponseModel[] = [];

  upgradeHeader: string[] = ["Membership ID", "Rank Code", "Ungraded Rank", "State", "Total Incentive", "Remarks"];

  totalPercentage: number = 0;
  totalIncentive: number = 0;

  modeMessage: string = "";

  exportData: RequestModel[] = [
    {
      memberId: "ET-111111",
      rankCode: "EP",
      state: "SELANGOR",
      referral: "NULL",
      topup: 100, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-222222",
      rankCode: "EM",
      state: "KUALA LUMPUR",
      referral: "NULL",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-333333",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-111111",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-444444",
      rankCode: "EP",
      state: "SELANGOR",
      referral: "ET-222222",
      topup: 100, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-555555",
      rankCode: "EM",
      state: "PENANG",
      referral: "ET-444444",
      topup: 30, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-666666",
      rankCode: "AM",
      state: "SELANGOR",
      referral: "ET-555555",
      topup: 60, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-777777",
      rankCode: "EM",
      state: "SELANGOR",
      referral: "ET-666666",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-888888",
      rankCode: "EM",
      state: "PENANG",
      referral: "ET-777777",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-999999",
      rankCode: "LP",
      state: "SELANGOR",
      referral: "ET-333333",
      topup: 140, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-101111",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-888888",
      topup: 10, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-102222",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-999999",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
    {
      memberId: "ET-103333",
      rankCode: "EM",
      state: "SELANGOR",
      referral: "ET-101111",
      topup: 50, 
      monthYear: new Date(2025, 0),
      date: new Date(2025, 0, 1)
    },
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
  }

  onModeChange(event: Event, fileInput: HTMLInputElement) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected Mode:', selectedValue);

    if (selectedValue === 'BEFORE_CUTOFF') {
      this.modeMessage = `To simulate a month worth of calculation before cut off period. 
                          This will assume that the all members have not yet meet the minimum topup requirement
                          and how their incentive are reflected.`;
    } else if (selectedValue === 'AFTER_CUTOFF') {
      this.modeMessage = `To simulate a month worth of calculation on/after cut off period. 
                          This will based on the topup column. The incentive will be given/not given according to if they meet then minimum topup requirement.`;
    } else if (selectedValue === 'UPGRADE') {
      this.modeMessage = `To simulate Nth month worth of calculation assuming buyer will buy the same amount each month. The incentives are given following the
                          cut off calculation, which means it will be based on the topup column. The incentive will be given/not given according to if they meet then minimum topup requirement.`;
    }

    this.responseData = [];
    this.dailyResponseData = [];
    fileInput.value = '';
    this.selectedFile = null;
  }

  exportExample(): void {
    // Data array to be used for the Excel file
    const data: RequestModel[] = this.exportData;
    let formattedData: any[] = []
    let fileName: string = "";

    if (this.selectedMode === "BEFORE_CUTOFF") {
      this.emptyBoolean = false;
      fileName = "incentive_before_cutoff";
      const headers = ["Membership ID", "Rank Code", "State", "Referral", "Date"];
      
      formattedData = [
        headers, 
        ...data.map(item => [item.memberId, item.rankCode, item.state, item.referral, item.date ]) // Data rows
      ];
    } else if (this.selectedMode === "AFTER_CUTOFF") {
      this.emptyBoolean = false;
      fileName = "incentive_after_cutoff";
      const headers = ["Membership ID", "Rank Code", "State", "Referral", "Topup", "Date"];
    
      formattedData = [
        headers, // This will be the header row
        ...data.map(item => [item.memberId, item.rankCode, item.state, item.referral, item.topup, item.date ]) // Data rows
      ];
    } else if (this.selectedMode === "UPGRADE") {
      this.emptyBoolean = false;
      fileName = "upgrade";
      const headers = ["Membership ID", "Rank Code", "State", "Referral", "Topup", "Month/Year"];
      
      formattedData = [
        headers, // This will be the header row
        ...data.map(item => [item.memberId, item.rankCode, item.state, item.referral, item.topup, item.monthYear]) // Data rows
      ];
    } else {
      this.emptyBoolean = true;
      this.emptyError = "Select a mode first.";
    }
    
    if (formattedData.length > 0) {
      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(formattedData);
  
      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, fileName);
      XLSX.writeFile(wb, fileName + ".xlsx");
    }

  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      if (!this.buyerMembershipId || !this.totalAmount || !this.selectedMode) { 
        this.emptyError = 'Please fill all fields.';
        return;
      }

      const params = new HttpParams()
                  .set('buyerMemberId', this.buyerMembershipId)
                  .set('totalAmount', this.totalAmount.toString())
                  .set('mode', this.selectedMode);

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      //this.displaySelectedFile()
      this.callBackend(params, formData);

      this.emptyBoolean = false;
    } else {
      this.emptyBoolean = true;
      this.emptyError = 'Please select a file.';
      if (!this.buyerMembershipId || !this.totalAmount || !this.selectedMode) { 
        this.emptyError = 'Please fill all fields and select a file.';
      }
    }
  }

  clearData(fileInput: HTMLInputElement): void {
    this.selectedFile = null;
    this.buyerMembershipId = '';
    this.totalAmount = null;
    this.selectedMode = '';
    this.responseData = [];
    this.dailyResponseData = [];
    fileInput.value = '';
    this.totalIncentive = 0;
    this.totalPercentage = 0;
  }

  callBackend(params: HttpParams, formData: FormData): void {
    this.http.post<any>(`${this.localApiUrl}`, formData, { params }).subscribe(
      (response) => {
        this.totalIncentive = 0;
        this.totalPercentage = 0;

        if (this.selectedMode === "AFTER_CUTOFF" || this.selectedMode === "BEFORE_CUTOFF") {
          response = response.sort((a: DailyResponseModel, b: DailyResponseModel) => {
            const parseDate = (dateStr: string) => {
              const [day, month, year] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day).getTime(); // Month is zero-based
            };
          
            return parseDate(a.date) - parseDate(b.date);
          });

          this.dailyResponseData = response;
          this.dailyResponseData.forEach(dailyResponse => {
              // Calculate sum of incentives and percentages
              dailyResponse['dailyIncentive'] = dailyResponse.incentives.reduce(
                (sum, incentive) => sum + incentive.totalIncentive, 0
              );
              dailyResponse['dailyPercentage'] = dailyResponse.incentives.reduce(
                (sum, incentive) => sum + incentive.percentage, 0
              );
            });

            console.log(this.dailyResponseData)

        } else if (this.selectedMode === "UPGRADE") {
          this.responseData = response;
        }
        
        // Calculate total percentage and total incentive
        this.dailyResponseData.forEach(dailyResponse => {
          this.totalIncentive += dailyResponse?.dailyIncentive || 0;
          this.totalPercentage += dailyResponse?.dailyPercentage || 0;
        });

        // Trigger change detection to update the view
        this.cdr.detectChanges();
        this.cdr.markForCheck();

      },
      (error) => {
        console.error('Error during simulation:', error);
        alert('Failed to simulate incentive');
      }
    );
  }
}
