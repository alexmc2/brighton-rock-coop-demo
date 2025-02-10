-- Add foreign key constraint for reconciled_by in demo_treasury_monthly_balances
ALTER TABLE demo_treasury_monthly_balances
    ADD CONSTRAINT fk_demo_treasury_monthly_balances_reconciler
    FOREIGN KEY (reconciled_by)
    REFERENCES demo_profiles(id)
    ON DELETE SET NULL;