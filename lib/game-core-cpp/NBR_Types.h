#pragma

#include <string>
#include <vector>

//Mirror of our Supabase/Node.js Player Interface

struct FNBRPlayerState {
    std::string PlayerID;
    std::string Username;
    float Health = 100.0f;
    float Shield = 0.0f;
    float OverShield = 50.0f;
    int32_t Kills = 0;

    struct FVector2D {
        float x;
        float y;
    } Position;

    float Heading;
};

//Loot RarityLevels for Unreal UI
enum class ENBRRarity : unit8 {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythic
};