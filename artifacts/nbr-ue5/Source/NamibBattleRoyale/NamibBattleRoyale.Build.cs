using UnrealBuildTool;

public class NamibBattleRoyale : ModuleRules
{
	public NamibBattleRoyale(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        // The "Fortnite" Module Set
		PublicDependencyModuleNames.AddRange(new string[] { 
            "Core", 
            "CoreUObject", 
            "Engine", 
            "InputCore", 
            "EnhancedInput", 
            "Http", 
            "Json", 
            "JsonUtilities", 
            "UMG", 
            "CommonUI" 
        });
	}
}