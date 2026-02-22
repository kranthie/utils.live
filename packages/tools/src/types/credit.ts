/**
 * Credit configuration for paid tools.
 */
export interface CreditConfig {
  /** Base credit cost per execution */
  base: number;
  /** Additional cost per KB over threshold (optional) */
  perKb?: number;
  /** Size threshold in bytes before extra charges (optional) */
  threshold?: number;
  /** Maximum credits per execution (optional) */
  max?: number;
}
