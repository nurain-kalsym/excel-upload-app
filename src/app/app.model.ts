export interface ResponseModel {
    memberId: string;
    level: number | null;
    rankCode: string;
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
  }

  