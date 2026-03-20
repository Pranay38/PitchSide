import { ContainerScroll } from "./ui/container-scroll-animation";

export function ProSubscriptionScroll() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-4xl font-semibold text-[#0F172A] dark:text-white mb-8">
              Experience the match like a manager. <br />
              <span className="text-4xl md:text-[6rem] font-black font-outfit mt-1 leading-none text-[#16A34A]">
                Pitchside Pro
              </span>
            </h2>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=3840&auto=format&fit=crop"
          alt="Stadium Tactics Dashboard"
          className="mx-auto rounded-2xl object-cover h-full w-full object-center"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
