import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { RequestModel, ResponseModel } from './app.model';

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

  tableData: any[] = [];
  tableHeaders: string[] = [];

  emptyBoolean: boolean = false;
  emptyError: string = "No file selected. Please choose one."

  stagingApiUrl = '';
  localApiUrl = 'http://localhost:8050/api/v1/memberships/simulate-incentive'; // Local Backend URL

  responseHeader: string[] = ["Membership ID", "Level", "Rank Code", "State", "Percentage", "Total Incentive", "Remarks"];;
  responseData: ResponseModel[] = [];

  totalPercentage: number = 0;
  totalIncentive: number = 0;

  exportData: RequestModel[] = [
    {
      memberId: "ET-111111",
      rankCode: "EP",
      state: "SELANGOR",
      referral: "NULL",
      topup: 100, 
    },
    {
      memberId: "ET-222222",
      rankCode: "EM",
      state: "KUALA LUMPUR",
      referral: "NULL",
      topup: 50, 
    },
    {
      memberId: "ET-333333",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-111111",
      topup: 50, 
    },
    {
      memberId: "ET-444444",
      rankCode: "EP",
      state: "SELANGOR",
      referral: "ET-222222",
      topup: 100, 
    },
    {
      memberId: "ET-555555",
      rankCode: "EM",
      state: "PENANG",
      referral: "ET-444444",
      topup: 30, 
    },
    {
      memberId: "ET-666666",
      rankCode: "AM",
      state: "SELANGOR",
      referral: "ET-555555",
      topup: 60, 
    },
    {
      memberId: "ET-777777",
      rankCode: "EM",
      state: "SELANGOR",
      referral: "ET-666666",
      topup: 50, 
    },
    {
      memberId: "ET-888888",
      rankCode: "EM",
      state: "PENANG",
      referral: "ET-777777",
      topup: 50, 
    },
    {
      memberId: "ET-999999",
      rankCode: "LP",
      state: "SELANGOR",
      referral: "ET-333333",
      topup: 140, 
    },
    {
      memberId: "ET-101111",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-888888",
      topup: 10, 
    },
    {
      memberId: "ET-102222",
      rankCode: "EM",
      state: "JOHOR",
      referral: "ET-999999",
      topup: 50, 
    },
    {
      memberId: "ET-103333",
      rankCode: "EM",
      state: "SELANGOR",
      referral: "ET-101111",
      topup: 50, 
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
  }

  exportExample(): void {
    // Data array to be used for the Excel file
    const data: RequestModel[] = this.exportData;

    // Define the headers
    const headers = ["Membership ID", "Rank Code", "State", "Referral", "Topup"];

    // Convert data to an array of arrays to include headers as the first row
    const formattedData = [
      headers, // This will be the header row
      ...data.map(item => [item.memberId, item.rankCode, item.state, item.referral, item.topup]) // Data rows
    ];

    // Create worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(formattedData);

    // Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Simulate Incentive");
    XLSX.writeFile(wb, "simulate_incentive.xlsx");
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
      if (!this.buyerMembershipId || !this.totalAmount || !this.selectedMode) { 
        this.emptyError = 'Please fill all fields and select a file.';
      }
    }
  }

  clearData(fileInput: HTMLInputElement): void {
    this.selectedFile = null;
    this.tableHeaders = [];
    this.tableData = [];
    this.buyerMembershipId = '';
    this.totalAmount = null;
    this.selectedMode = '';
    this.responseData = [];
    fileInput.value = '';
  }

  displaySelectedFile(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const ab = e.target.result;
        const workbook = XLSX.read(ab, { type: 'array' });
  
        // Assuming the first sheet is the one you want
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
        if (jsonData.length > 0) {
          this.tableHeaders = jsonData[0] as string[]; // First row as headers
          this.tableData = jsonData.slice(1); // Rest as data
        }
      };
  
      reader.readAsArrayBuffer(this.selectedFile);
    }
  }

  callBackend(params: HttpParams, formData: FormData): void {
    this.http.post<any>(`${this.localApiUrl}`, formData, { params }).subscribe(
      (response) => {
        this.responseData = response;

        // Calculate total percentage and total incentive
        this.totalPercentage = this.responseData.reduce((sum, item) => sum + (item.percentage || 0), 0);
        this.totalIncentive = this.responseData.reduce((sum, item) => sum + (item.totalIncentive || 0), 0);
      },
      (error) => {
        console.error('Error during simulation:', error);
        alert('Failed to simulate incentive');
      }
    );
  }
}
