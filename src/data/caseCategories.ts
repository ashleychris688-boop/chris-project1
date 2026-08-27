import { PartyCapacity } from '../types';

export interface CaseCategoryConfig {
  category: string;
  subTypes: string[];
  recommendedCapacities: PartyCapacity[];
}

export const DEFAULT_CASE_CATEGORIES: CaseCategoryConfig[] = [
  {
    category: 'Civil Litigation',
    subTypes: [
      'Accidents',
      'Road Traffic Accident (RTA)',
      'Personal Injury',
      'General Civil Suit',
      'Declaratory Suit',
      'Recovery of Damages',
      'Breach of Contract',
      'Negligence',
      'Defamation',
      'Debt Recovery',
      'Professional Negligence',
      'Tort Claims',
      'Specific Performance',
      'Injunction Application',
      'Judicial Review'
    ],
    recommendedCapacities: ['Plaintiff', 'Defendant', 'Applicant', 'Respondent', 'Interested Party', 'Decree Holder', 'Judgment Debtor']
  },
  {
    category: 'Accidents',
    subTypes: [
      'Road Traffic Accident (RTA)',
      'Personal Injury Claim',
      'Motor Vehicle Collision',
      'Pedestrian Knockdown',
      'Passenger Injury Claim',
      'Motorcycle / Boda Boda Accident',
      'Workplace Accident (WIBA)',
      'Fatal Accident / Dependency Claim',
      'Public Service Vehicle (PSV) Accident',
      'Property Damage / Vehicle Repair Claim'
    ],
    recommendedCapacities: ['Claimant', 'Plaintiff', 'Defendant', 'Insured', 'Insurer', 'Interested Party', 'Legal Representative']
  },
  {
    category: 'Criminal Matters',
    subTypes: [
      'Criminal Case',
      'Bail/Bond Application',
      'Criminal Appeal',
      'Revision',
      'Private Prosecution'
    ],
    recommendedCapacities: ['Complainant', 'Accused', 'Witness']
  },
  {
    category: 'Family Law',
    subTypes: [
      'Divorce',
      'Child Custody',
      'Child Maintenance',
      'Adoption',
      'Guardianship',
      'Domestic Violence (Protection Orders)',
      'Matrimonial Property Dispute'
    ],
    recommendedCapacities: ['Petitioner', 'Respondent', 'Applicant', 'Guardian', 'Legal Representative']
  },
  {
    category: 'Succession & Probate',
    subTypes: [
      'Succession Cause',
      'Probate',
      'Letters of Administration',
      'Confirmation of Grant',
      'Revocation of Grant',
      'Estate Distribution'
    ],
    recommendedCapacities: ['Petitioner', 'Beneficiary', 'Administrator', 'Executor', 'Objector']
  },
  {
    category: 'Land & Environment',
    subTypes: [
      'Land Dispute',
      'Boundary Dispute',
      'Eviction',
      'Adverse Possession',
      'Land Ownership',
      'Environmental Matter',
      'Easement/Right of Way',
      'Trespass to Land'
    ],
    recommendedCapacities: ['Plaintiff', 'Defendant', 'Applicant', 'Respondent', 'Petitioner', 'Interested Party']
  },
  {
    category: 'Employment & Labour',
    subTypes: [
      'Employment Dispute',
      'Unfair Termination',
      'Workplace Injury Claim',
      'Labour Relations Matter',
      'Employment Appeal'
    ],
    recommendedCapacities: ['Claimant', 'Respondent']
  },
  {
    category: 'Commercial & Corporate',
    subTypes: [
      'Commercial Dispute',
      'Company Matter',
      'Partnership Dispute',
      'Insolvency',
      'Bankruptcy',
      'Liquidation',
      'Shareholder Dispute',
      'Intellectual Property'
    ],
    recommendedCapacities: ['Plaintiff', 'Defendant', 'Applicant', 'Respondent', 'Interested Party', 'Decree Holder']
  },
  {
    category: 'Insurance Matters',
    subTypes: [
      'Insurance Claim',
      'Declaratory Suit',
      'Subrogation',
      'Recovery Matter',
      'Policy Dispute',
      'Compensation Claim'
    ],
    recommendedCapacities: ['Claimant', 'Insured', 'Insurer', 'Respondent', 'Applicant']
  },
  {
    category: 'Constitutional & Public Law',
    subTypes: [
      'Constitutional Petition',
      'Human Rights Petition',
      'Election Petition',
      'Judicial Review',
      'Public Interest Litigation'
    ],
    recommendedCapacities: ['Petitioner', 'Respondent', 'Applicant', 'Interested Party']
  },
  {
    category: 'Appeals',
    subTypes: [
      'Civil Appeal',
      'Criminal Appeal',
      'Employment Appeal',
      'Environment & Land Appeal',
      'Tax Appeal'
    ],
    recommendedCapacities: ['Appellant', 'Respondent', 'Interested Party']
  },
  {
    category: 'Tribunal Matters',
    subTypes: [
      'Business Premises Rent Tribunal (BPRT)',
      'Co-operative Tribunal',
      'Tax Appeals Tribunal',
      'Public Procurement Tribunal',
      'Sports Disputes Tribunal',
      'Political Parties Disputes Tribunal',
      'Small Claims Court',
      'Environment Tribunal'
    ],
    recommendedCapacities: ['Claimant', 'Applicant', 'Respondent', 'Objector']
  },
  {
    category: 'Alternative Dispute Resolution (ADR)',
    subTypes: [
      'Mediation',
      'Arbitration',
      'Conciliation',
      'Negotiation'
    ],
    recommendedCapacities: ['Claimant', 'Respondent', 'Applicant']
  },
  {
    category: 'Debt & Recovery',
    subTypes: [
      'Loan Recovery',
      'Debt Collection',
      'Execution Proceedings',
      'Garnishee Proceedings',
      'Bankruptcy'
    ],
    recommendedCapacities: ['Decree Holder', 'Judgment Debtor', 'Claimant', 'Respondent']
  },
  {
    category: 'Probate & Estate Administration',
    subTypes: [
      'Will Drafting',
      'Estate Administration',
      'Probate Dispute',
      'Trust Administration'
    ],
    recommendedCapacities: ['Petitioner', 'Beneficiary', 'Administrator', 'Executor']
  },
  {
    category: 'Conveyancing',
    subTypes: [
      'Sale Agreement',
      'Purchase Agreement',
      'Transfer of Land',
      'Lease Registration',
      'Charge/Mortgage Registration',
      'Discharge of Charge'
    ],
    recommendedCapacities: ['Legal Representative', 'Applicant']
  },
  {
    category: 'Immigration',
    subTypes: [
      'Work Permit',
      'Citizenship Application',
      'Visa Appeal',
      'Immigration Advisory'
    ],
    recommendedCapacities: ['Applicant', 'Appellant', 'Respondent']
  },
  {
    category: 'Intellectual Property',
    subTypes: [
      'Trademark Registration',
      'Copyright Matter',
      'Patent Dispute',
      'IP Infringement'
    ],
    recommendedCapacities: ['Applicant', 'Respondent', 'Claimant']
  },
  {
    category: 'Miscellaneous',
    subTypes: [
      'Legal Opinion',
      'Demand Letter',
      'Notarial Services',
      'Affidavit & Commissioner for Oaths Services',
      'Company Registration',
      'NGO Registration'
    ],
    recommendedCapacities: ['Applicant', 'Legal Representative', 'Petitioner']
  }
];
