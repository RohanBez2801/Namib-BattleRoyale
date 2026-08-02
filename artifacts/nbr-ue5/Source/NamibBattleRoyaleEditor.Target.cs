using UnrealBuildTool;
using System.Collections.Generic;

public class NamibBattleRoyaleEditorTarget : TargetRules
{
	public NamibBattleRoyaleEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("NamibBattleRoyale");
	}
}