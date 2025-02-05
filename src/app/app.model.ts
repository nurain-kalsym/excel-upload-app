export interface ResponseModel {
    memberId: string;
    level: number | null;
    rankCode: string;
    upgradedCode: string | null;
    state: string;
    totalIncentive: number;
    percentage: number;
    remarks: string | null;
  }

  export interface RequestModel {
    memberId: string;
    rankCode: string;
    state: string;
    referral: string;
    topup: number;
    monthYear: Date;
    date: Date;
  }

  export interface DailyResponseModel {
    date: string;
    month?: string | null;
    year?: string | null;
    dailyIncentive?: number;
    dailyPercentage?: number;
    incentives: ResponseModel[];
  }



  