#pragma once
#include <juce_audio_processors/juce_audio_processors.h>

// Le plugin laisse l'audio intact (insert / effet transparent) et envoie une copie mono
// au visualiseur via une FIFO sans verrou.
class AuroraProcessor : public juce::AudioProcessor
{
public:
    AuroraProcessor();
    ~AuroraProcessor() override = default;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout&) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Aurora Visualizer"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

    // Lecture côté interface : retourne le nombre d'échantillons réellement copiés.
    int pullSamples (float* dest, int maxNum);
    double getCurrentSampleRate() const { return sampleRate.load(); }

    juce::AudioProcessorValueTreeState apvts;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout();

    static constexpr int fifoSize = 1 << 15;
    juce::AbstractFifo fifo { fifoSize };
    std::array<float, fifoSize> fifoData {};
    std::atomic<double> sampleRate { 44100.0 };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (AuroraProcessor)
};
