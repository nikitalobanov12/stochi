import { areSafetyContractsEquivalent } from "~/lib/engine/contract";

type SafetyContractPayload = Parameters<typeof areSafetyContractsEquivalent>[0];

export type ContractFixture = {
  name: string;
  expectedEquivalent: boolean;
  tsPayload: SafetyContractPayload;
  goPayload: SafetyContractPayload;
};

export type ContractFixtureResult = {
  name: string;
  expectedEquivalent: boolean;
  isEquivalent: boolean;
  matchesExpected: boolean;
};

export function evaluateContractFixture(
  fixture: ContractFixture,
): ContractFixtureResult {
  const isEquivalent = areSafetyContractsEquivalent(
    fixture.tsPayload,
    fixture.goPayload,
  );

  return {
    name: fixture.name,
    expectedEquivalent: fixture.expectedEquivalent,
    isEquivalent,
    matchesExpected: isEquivalent === fixture.expectedEquivalent,
  };
}
