#include "PluginProcessor.h"
#include "PluginEditor.h"

AuroraProcessor::AuroraProcessor()
    : AudioProcessor (BusesProperties()
                          .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "STATE", createLayout())
{
}

juce::AudioProcessorValueTreeState::ParameterLayout AuroraProcessor::createLayout()
{
    using namespace juce;
    std::vector<std::unique_ptr<RangedAudioParameter>> p;
    p.push_back (std::make_unique<AudioParameterFloat> (ParameterID { "sensitivity", 1 }, "Sensibilite",
                                                        NormalisableRange<float> (0.25f, 4.0f, 0.01f, 0.5f), 1.0f));
    p.push_back (std::make_unique<AudioParameterFloat> (ParameterID { "smoothing", 1 }, "Fluidite",
                                                        NormalisableRange<float> (0.0f, 1.0f, 0.01f), 0.6f));
    p.push_back (std::make_unique<AudioParameterFloat> (ParameterID { "speed", 1 }, "Vitesse",
                                                        NormalisableRange<float> (0.2f, 3.0f, 0.01f), 1.0f));
    p.push_back (std::make_unique<AudioParameterFloat> (ParameterID { "stars", 1 }, "Etoiles",
                                                        NormalisableRange<float> (0.0f, 1.0f, 0.01f), 0.7f));
    p.push_back (std::make_unique<AudioParameterChoice> (ParameterID { "palette", 1 }, "Palette",
                                                         StringArray { "Boreale verte", "Violet", "Rose polaire", "Glace" }, 0));
    return { p.begin(), p.end() };
}

void AuroraProcessor::prepareToPlay (double sr, int)
{
    sampleRate = sr;
    fifo.reset();
}

bool AuroraProcessor::isBusesLayoutSupported (const BusesLayout& l) const
{
    const auto out = l.getMainOutputChannelSet();
    return (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo())
           && out == l.getMainInputChannelSet();
}

void AuroraProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    juce::ScopedNoDenormals noDenormals;
    const int n = buffer.getNumSamples();
    const int chans = buffer.getNumChannels();
    if (chans == 0 || n == 0) return;

    // Copie mono dans la FIFO ; l'audio n'est pas modifié. Si la FIFO est pleine, on jette.
    int s1, n1, s2, n2;
    fifo.prepareToWrite (n, s1, n1, s2, n2);
    const float inv = 1.0f / (float) chans;
    auto mix = [&] (int dst, int src, int count)
    {
        for (int i = 0; i < count; ++i)
        {
            float v = 0.0f;
            for (int c = 0; c < chans; ++c) v += buffer.getReadPointer (c)[src + i];
            fifoData[(size_t) (dst + i)] = v * inv;
        }
    };
    mix (s1, 0, n1);
    if (n2 > 0) mix (s2, n1, n2);
    fifo.finishedWrite (n1 + n2);
}

int AuroraProcessor::pullSamples (float* dest, int maxNum)
{
    const int num = juce::jmin (maxNum, fifo.getNumReady());
    int s1, n1, s2, n2;
    fifo.prepareToRead (num, s1, n1, s2, n2);
    std::copy_n (fifoData.begin() + s1, n1, dest);
    if (n2 > 0) std::copy_n (fifoData.begin() + s2, n2, dest + n1);
    fifo.finishedRead (n1 + n2);
    return n1 + n2;
}

juce::AudioProcessorEditor* AuroraProcessor::createEditor() { return new AuroraEditor (*this); }

void AuroraProcessor::getStateInformation (juce::MemoryBlock& dest)
{
    if (auto xml = apvts.copyState().createXml()) copyXmlToBinary (*xml, dest);
}

void AuroraProcessor::setStateInformation (const void* data, int size)
{
    if (auto xml = getXmlFromBinary (data, size))
        if (xml->hasTagName (apvts.state.getType())) apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new AuroraProcessor(); }
