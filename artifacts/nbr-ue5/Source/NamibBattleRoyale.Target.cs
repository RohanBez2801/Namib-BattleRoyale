using UnrealBuildTool;
using System.Collections.Generic;

public class NamibBattleRoyaleTarget : TargetRules
{
	public NamibBattleRoyaleTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("NamibBattleRoyale");
	}
}